window.HydraModel = class HydraModel {
  constructor(initialHeads = 9) {
    this.heads = initialHeads;
  }

  cutHead() {
    if (this.heads <= 0) return this.heads;

    this.heads -= 1;
    return this.heads;
  }

  regrow(amount = 0) {
    this.heads += Math.max(0, amount);
    return this.heads;
  }
};
