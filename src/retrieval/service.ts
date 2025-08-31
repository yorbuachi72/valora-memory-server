// Minimal retrieval service for testing
export const searchMemories = async (query: string) => {
  return [];
};

export const retrievalService = {
  searchMemories,
  search: async (query: string) => {
    return [];
  },
  init: async () => {},
  addMemory: async (id: string, content: string) => {},
  updateMemory: async (id: string, content: string) => {},
  deleteMemory: async (id: string) => {},
};
