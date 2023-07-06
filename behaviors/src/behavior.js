const C3 = self.C3;

//<-- BEHAVIOR_INFO -->

C3.Behaviors[BEHAVIOR_INFO.id] = class extends C3.SDKBehaviorBase {
  constructor(opts) {
    if (BEHAVIOR_INFO.hasDomSide) {
      super(opts, BEHAVIOR_INFO.id);
    } else {
      super(opts);
    }
  }

  Release() {
    super.Release();
  }
};
const B_C = C3.Behaviors[BEHAVIOR_INFO.id];
B_C.Type = class extends C3.SDKBehaviorTypeBase {
  constructor(objectClass) {
    super(objectClass);
  }

  Release() {
    super.Release();
  }

  OnCreate() {}
};

//====== SCRIPT INTERFACE ======
const map = new WeakMap();

//<-- SCRIPT_INTERFACE -->

const scriptInterface = getScriptInterface(self.IBehaviorInstance, map);

// extend script interface with plugin actions
Object.keys(BEHAVIOR_INFO.Acts).forEach((key) => {
  const ace = BEHAVIOR_INFO.Acts[key];
  if (!ace.autoScriptInterface) return;
  scriptInterface.prototype[key] = function (...args) {
    const sdkInst = map.get(this);
    B_C.Acts[key].call(sdkInst, ...args);
  };
});

const addonTriggers = [];

// extend script interface with plugin conditions
Object.keys(BEHAVIOR_INFO.Cnds).forEach((key) => {
  const ace = BEHAVIOR_INFO.Cnds[key];
  if (!ace.autoScriptInterface || ace.isStatic || ace.isLooping) return;
  if (ace.isTrigger) {
    scriptInterface.prototype[key] = function (callback, ...args) {
      const callbackWrapper = () => {
        const sdkInst = map.get(this);
        if (B_C.Cnds[key].call(sdkInst, ...args)) {
          callback();
        }
      };
      this.addEventListener(key, callbackWrapper, false);
      return () => this.removeEventListener(key, callbackWrapper, false);
    };
  } else {
    scriptInterface.prototype[key] = function (...args) {
      const sdkInst = map.get(this);
      return B_C.Cnds[key].call(sdkInst, ...args);
    };
  }
});

// extend script interface with plugin expressions
Object.keys(BEHAVIOR_INFO.Exps).forEach((key) => {
  const ace = BEHAVIOR_INFO.Exps[key];
  if (!ace.autoScriptInterface) return;
  scriptInterface.prototype[key] = function (...args) {
    const sdkInst = map.get(this);
    return B_C.Exps[key].call(sdkInst, ...args);
  };
});
//====== SCRIPT INTERFACE ======

//============ ACES ============
B_C.Acts = {};
B_C.Cnds = {};
B_C.Exps = {};
Object.keys(BEHAVIOR_INFO.Acts).forEach((key) => {
  const ace = BEHAVIOR_INFO.Acts[key];
  B_C.Acts[key] = function (...args) {
    if (ace.forward) ace.forward(this).call(this, ...args);
    else if (ace.handler) ace.handler.call(this, ...args);
  };
});
Object.keys(BEHAVIOR_INFO.Cnds).forEach((key) => {
  const ace = BEHAVIOR_INFO.Cnds[key];
  B_C.Cnds[key] = function (...args) {
    if (ace.forward) return ace.forward(this).call(this, ...args);
    if (ace.handler) return ace.handler.call(this, ...args);
  };
  if (ace.isTrigger && ace.autoScriptInterface) {
    addonTriggers.push({
      method: key,
      id: key,
    });
  }
});
Object.keys(BEHAVIOR_INFO.Exps).forEach((key) => {
  const ace = BEHAVIOR_INFO.Exps[key];
  B_C.Exps[key] = function (...args) {
    if (ace.forward) return ace.forward(this).call(this, ...args);
    if (ace.handler) return ace.handler.call(this, ...args);
  };
});
//============ ACES ============

//<-- INSTANCE -->

B_C.Instance = getInstanceJs(
  C3.SDKBehaviorInstanceBase,
  scriptInterface,
  addonTriggers,
  C3
);
