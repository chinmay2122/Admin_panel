import React from "react";
import { usersRepo } from "@/lib/data";
import { UsersClient } from "./UsersClient";

export default async function UsersPage() {
  const users = await usersRepo.list();

  return <UsersClient initialUsers={users} />;
}
