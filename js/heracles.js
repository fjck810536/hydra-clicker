window.HeraclesModel = class HeraclesModel {
  constructor() {
    this.cuts = 0;
  }

  attack(hydra) {
    if (!hydra || hydra.heads <= 0) return false;

    hydra.cutHead();
    this.cuts += 1;
    return true;
  }
};
