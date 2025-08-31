// Mock for lowdb to handle ES module issues in tests
export class Low {
  constructor(adapter, defaultData = {}) {
    this.adapter = adapter;
    this.data = defaultData || { memories: [] };
    // Ensure data has the expected structure
    if (!this.data.memories) {
      this.data.memories = [];
    }
  }

  async read() {
    // Ensure data is properly initialized
    if (!this.data) {
      this.data = { memories: [] };
    }
    if (!this.data.memories) {
      this.data.memories = [];
    }
    return this.data;
  }

  async write() {
    if (this.adapter.write) {
      await this.adapter.write(this.data);
    }
  }
}

export default { Low };
