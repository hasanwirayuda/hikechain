import { MountainRepository } from "./mountains.repository";

const makeError = (msg: string, code: string, status: number) => {
  const err = new Error(msg) as Error & { code: string; statusCode: number };
  err.code = code;
  err.statusCode = status;
  return err;
};

export const MountainsService = {
  async getAll() {
    return MountainRepository.findAll();
  },

  async getById(id: string) {
    const mountain = await MountainRepository.findById(id);
    if (!mountain) throw makeError("Mountain not found", "NOT_FOUND", 404);
    return mountain;
  },
};
