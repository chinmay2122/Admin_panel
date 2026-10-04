import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SingularApplicationRedirectPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/admin/cor/applications/${id}`);
}
