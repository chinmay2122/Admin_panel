import {
  corRequestsRepo,
  corMembersRepo,
  corOpportunitiesRepo,
  corApplicationsRepo,
  corEventsRepo,
  corNotesRepo,
  corActivityRepo,
  calculateMatch,
} from "../lib/data";
import { CorApplicationStatus } from "../lib/types";

async function runCorWorkflowTests() {
  console.log("\n=======================================================");
  console.log("🚀 STARTING COMPREHENSIVE COR WORKFLOW INTEGRATION TESTS");
  console.log("=======================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: COR Requests Listing and Initial State
    // -------------------------------------------------------------
    console.log("👉 Test Suite 1: COR Intake & Request Evaluation");
    const requests = await corRequestsRepo.list();
    assert(requests.length > 0, `Loaded ${requests.length} COR requests`);

    const pendingRequest = requests.find((r) => r.status === "pending");
    assert(!!pendingRequest, `Found pending request for creator: ${pendingRequest?.creatorName} (${pendingRequest?.id})`);

    // Verify detailed questionnaire fields
    assert(!!pendingRequest?.skills && pendingRequest.skills.length > 0, "Questionnaire includes skills");
    assert(!!pendingRequest?.desiredRole, "Questionnaire includes desired role");
    assert(!!pendingRequest?.education?.degree, "Questionnaire includes education degree");
    assert(!!pendingRequest?.workHistory && pendingRequest.workHistory.length > 0, "Questionnaire includes work history");
    assert(!!pendingRequest?.links?.portfolio, "Questionnaire includes portfolio link");
    assert(!!pendingRequest?.documents?.resumeUrl, "Questionnaire includes resume document link");

    // -------------------------------------------------------------
    // TEST 2: Approve COR Request -> Member Enrollment
    // -------------------------------------------------------------
    console.log("\n👉 Test Suite 2: Approve Request & Member Enrollment");
    const testReqId = pendingRequest!.id;
    const approvedRequest = await corRequestsRepo.approve(testReqId, "admin_test");
    assert(!!approvedRequest, "Request approval returned valid object");
    assert(approvedRequest?.status === "approved", "Request status updated to 'approved'");

    const testMember = await corMembersRepo.getByCreatorId(approvedRequest!.creatorId);
    assert(!!testMember, "COR Member record generated upon approval");
    assert(testMember?.status === "active", "New COR Member has active status");
    assert(testMember?.creatorId === approvedRequest?.creatorId, "COR Member retains creatorId link");

    // Verify activity recorded
    const activities = await corActivityRepo.list(5);
    const hasApprovalActivity = activities.some((a) => a.actionType === "request_approved");
    assert(hasApprovalActivity, "Audit activity recorded for request approval");

    // -------------------------------------------------------------
    // TEST 3: Candidate & Opportunity Rule-Based Matching
    // -------------------------------------------------------------
    console.log("\n👉 Test Suite 3: Candidate & Opportunity Matching Engine");
    const opportunities = await corOpportunitiesRepo.list({ status: "open" });
    assert(opportunities.length > 0, `Loaded ${opportunities.length} open opportunities`);

    const testOpportunity = opportunities[0];
    const matchResult = calculateMatch(testMember!, testOpportunity);
    console.log(`     Match Score for "${testMember!.name}" x "${testOpportunity.title}": ${matchResult.scorePercentage}%`);
    assert(typeof matchResult.scorePercentage === "number" && matchResult.scorePercentage >= 0 && matchResult.scorePercentage <= 100, "Match score is normalized between 0-100");
    assert(Array.isArray(matchResult.matchedSkills), "Matched skills is an array");
    assert(Array.isArray(matchResult.reasons) && matchResult.reasons.length > 0, "Transparent rule-based reasons provided");

    // -------------------------------------------------------------
    // TEST 4: Admin Creates Application on Behalf of Member
    // -------------------------------------------------------------
    console.log("\n👉 Test Suite 4: 'Apply for Member' Workflow");
    const newApplication = await corApplicationsRepo.create({
      creatorId: testMember!.creatorId || "crt_01",
      corMemberId: testMember!.id,
      opportunityId: testOpportunity.id,
      status: "Preparing Application",
      consultant: "Admin Test",
      appliedBy: "admin_test",
      notes: "Tailored portfolio submitted for high-profile consideration.",
    });

    assert(!!newApplication.id, `Created application ${newApplication.id}`);
    assert(newApplication.corMemberId === testMember!.id, "Application references cor_member_id");
    assert(newApplication.creatorId === (testMember!.creatorId || "crt_01"), "Application references creator_id for future creator-side portal");
    assert(newApplication.status === "Preparing Application", "Initial status set to 'Preparing Application'");

    // Verify initial event recorded
    const initialEvents = await corEventsRepo.listForApplication(newApplication.id);
    assert(initialEvents.length >= 1, "Initial application event logged in timeline");

    // -------------------------------------------------------------
    // TEST 5: Status Progression & Timeline Event Immutability
    // -------------------------------------------------------------
    console.log("\n👉 Test Suite 5: Status Transitions & Event History");
    const statusProgression: CorApplicationStatus[] = ["Applied", "Screening", "Interview", "Offer"];

    for (const nextStatus of statusProgression) {
      await corApplicationsRepo.updateStatus(
        newApplication.id,
        nextStatus,
        "admin_test",
        "Admin",
        `Transitioning to ${nextStatus}`
      );
    }

    const fetchedApp = await corApplicationsRepo.getById(newApplication.id);
    assert(fetchedApp?.status === "Offer", "Application reached 'Offer' status");

    const fullHistory = await corEventsRepo.listForApplication(newApplication.id);
    assert(fullHistory.length >= 5, `Complete history preserved: ${fullHistory.length} chronological events`);

    const hasAppliedEvent = fullHistory.some((e) => e.newStatus === "Applied");
    const hasScreeningEvent = fullHistory.some((e) => e.newStatus === "Screening");
    const hasInterviewEvent = fullHistory.some((e) => e.newStatus === "Interview");
    const hasOfferEvent = fullHistory.some((e) => e.newStatus === "Offer");
    assert(hasAppliedEvent && hasScreeningEvent && hasInterviewEvent && hasOfferEvent, "Every status event safely preserved without overwrite");

    // -------------------------------------------------------------
    // TEST 6: Internal Admin Notes & Privacy Isolation
    // -------------------------------------------------------------
    console.log("\n👉 Test Suite 6: Internal Notes & Privacy Isolation");
    const adminNote = await corNotesRepo.create({
      corMemberId: testMember!.id,
      applicationId: newApplication.id,
      authorId: "admin_test",
      authorName: "Career Operations Lead",
      content: "CONFIDENTIAL: Recruiter indicates compensation flexibility up to $165k.",
    });

    assert(!!adminNote.id, "Internal admin note created successfully");
    assert(adminNote.isInternalOnly === true, "Admin note explicitly marked isInternalOnly: true");

    const memberNotes = await corNotesRepo.listForMember(testMember!.id);
    assert(memberNotes.some((n) => n.id === adminNote.id), "Admin note retrieved for admin console");

    // Verification of separation: Ensure creator-facing entities do not bundle internal notes
    const sanitizedApp = await corApplicationsRepo.getById(newApplication.id);
    assert(!("internalNotes" in (sanitizedApp as any)), "Application entity strictly isolates admin notes");

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log("\n=======================================================");
    console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("=======================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("❌ Unexpected test exception:", err);
    process.exit(1);
  }
}

runCorWorkflowTests();
