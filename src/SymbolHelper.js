class SymbolHelper {
  constructor() {
    this.symbolMap = new Map();
  }

  /**
   * Adds a symbol-keyed value to the object
   * @param {Object} target - The target object
   * @param {string} name - A name/description for the symbol
   * @param {*} value - The value to assign
   * @returns {Symbol} - The symbol used
   */
  addSymbolProperty(target, name, value) {
    const sym = Symbol(name);

    target[sym] = value;
    this.symbolMap.set(name, sym);

    return sym;
  }

  /**
   * Gets the value from an object by symbol name
   * @param {Object} target - The target object
   * @param {string} name - The name/description used to create the symbol
   * @returns {*} - The value, or undefined
   */
  getValueByName(target, name) {
    const sym = this.symbolMap.get(name);

    return sym ? target[sym] : undefined;
  }

  /**
   * Gets the value from an object using a symbol directly
   * @param {Object} target - The target object
   * @param {Symbol} symbol - The symbol used as a key
   * @returns {*} - The value, or undefined
   */
  getValueBySymbol(target, symbol) {
    return target[symbol];
  }
}

const symbolHelper = new SymbolHelper();

function setOnBeforeSave(obj, handler) {
  symbolHelper.addSymbolProperty(obj, 'onBeforeSave', handler);
}

function getOnBeforeSave(obj) {
  return symbolHelper.getValueByName(obj, 'onBeforeSave');
}

function setOnBeforeCalculateFC(obj, handler) {
  symbolHelper.addSymbolProperty(obj, 'setOnBeforeCalculateFC', handler);
}

function getOnBeforeCalculateFC(obj) {
  return symbolHelper.getValueByName(obj, 'setOnBeforeCalculateFC');
}

function getEntitityFCs(obj) {
  return symbolHelper.getValueByName(obj, 'entitityFC');
}

function addEntitityFCs(obj, handler) {
  const reference = getEntitityFCs(obj);

  if(!reference){
    symbolHelper.addSymbolProperty(obj, 'entitityFC', handler);
  } else {
    Object.assign(reference, handler);
  }
}


module.exports = {
  symbolHelper,
  setOnBeforeSave,
  getOnBeforeSave,
  setOnBeforeCalculateFC,
  getOnBeforeCalculateFC,

  getEntitityFCs,
  addEntitityFCs
};