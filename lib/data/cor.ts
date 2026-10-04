import { corMembersRepo } from "./cor-members";
import { CorMember, CorFilters } from "../types";

export const corRepo = {
  list: (filters?: CorFilters) => corMembersRepo.list(filters),
  getById: (id: string) => corMembersRepo.getById(id),
  getByCreatorId: (creatorId: string) => corMembersRepo.getByCreatorId(creatorId),
  create: (data: Omit<CorMember, "id">) => corMembersRepo.create(data),
  update: (id: string, data: Partial<CorMember>) => corMembersRepo.update(id, data),
  remove: (id: string) => corMembersRepo.remove(id),
  stats: () => corMembersRepo.stats(),
};

export { corMembersRepo };
