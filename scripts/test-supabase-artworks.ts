import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Testing Supabase connection with URL:", url);

if (!url || !serviceKey) {
  console.error("Missing SUPABASE URL or KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function testSupabase() {
  console.log("\n1. Fetching Profiles...");
  const { data: profiles, error: profError } = await supabase.from("profiles").select("id, full_name, email, role").limit(10);
  if (profError) {
    console.error("Error fetching profiles:", profError);
  } else {
    console.log(`Found ${profiles?.length} profiles:`, profiles);
  }

  console.log("\n2. Fetching Artworks...");
  const { data: artworks, error: artError } = await supabase.from("artworks").select("id, title, creator_id, artist_name").limit(10);
  if (artError) {
    console.error("Error fetching artworks:", artError);
  } else {
    console.log(`Found ${artworks?.length} artworks:`, artworks);
  }

  console.log("\n2b. Fetching Reports...");
  const { data: reports, error: repError } = await supabase.from("reports").select("*, artwork:artworks(*)").limit(10);
  if (repError) {
    console.error("Error fetching reports:", repError);
  } else {
    console.log(`Found ${reports?.length} reports:`, reports);
    if (reports && reports.length > 0) {
      const targetReport = reports[0];
      console.log(`\n2c. Testing dismissing report ${targetReport.id}...`);
      const payload: Record<string, any> = {
        status: "dismissed",
        updated_at: new Date().toISOString(),
        resolved_at: new Date().toISOString(),
        moderation_action: "report_dismissed",
        moderation_note: "Test dismissal note",
      };
      const { data: updatedRep, error: updateRepErr } = await supabase
        .from("reports")
        .update(payload)
        .eq("id", targetReport.id)
        .select()
        .single();

      if (updateRepErr) {
        console.error("❌ Failed to update report status:", updateRepErr);
      } else {
        console.log("✅ Successfully dismissed report:", updatedRep);
        // Revert back to pending
        await supabase.from("reports").update({ status: "pending", moderation_action: null, moderation_note: null, resolved_at: null }).eq("id", targetReport.id);
        console.log("✅ Reverted report back to pending.");
      }
    }
  }

  if (profiles && profiles.length > 0) {
    const testCreator = profiles.find((p) => p.role === "Creator" || p.role === "creator") || profiles[0];
    console.log("\n3. Testing insert into artworks with creator_id:", testCreator.id);

    const testPayload = {
      creator_id: testCreator.id,
      title: `Verification Piece ${Date.now()}`,
      art_type: "Painting",
      artist_name: testCreator.full_name || "Test Artist",
      description: "Direct Supabase database insertion test",
      image_url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800",
      price: 1200,
      status: "Available",
      is_published: true,
      year: "2026",
      dimensions: "100 x 120 cm",
      location: "Mumbai",
      collection: "Test Series",
      price_visibility: "Show Price",
    };

    const { data: inserted, error: insertError } = await supabase
      .from("artworks")
      .insert(testPayload)
      .select()
      .single();

    if (insertError) {
      console.error("❌ Insertion failed:", insertError);
    } else {
      console.log("✅ Successfully inserted artwork into Supabase database:", inserted.id);
      const { error: delError } = await supabase.from("artworks").delete().eq("id", inserted.id);
      if (!delError) {
        console.log("✅ Cleaned up test artwork.");
      }
    }
  }

  // 4. Test Storage Upload
  console.log("\n4. Testing Storage upload to bucket 'artworks'...");
  try {
    const testBuffer = Buffer.from("test image content");
    const testFilePath = `test/${Date.now()}_test.txt`;
    const { data: uploadRes, error: uploadErr } = await supabase.storage
      .from("artworks")
      .upload(testFilePath, testBuffer, { contentType: "text/plain" });

    if (uploadErr) {
      console.error("❌ Storage upload failed:", uploadErr);
    } else {
      console.log("✅ Storage upload succeeded:", uploadRes);
      const { data: pubData } = supabase.storage.from("artworks").getPublicUrl(uploadRes.path);
      console.log("Public URL:", pubData.publicUrl);
      await supabase.storage.from("artworks").remove([uploadRes.path]);
      console.log("✅ Storage cleanup succeeded.");
    }
  } catch (stErr) {
    console.error("Storage exception:", stErr);
  }
}

testSupabase();
