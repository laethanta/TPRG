const fs = require('fs');
const file = 'src/界面/状态栏/App.vue';
let code = fs.readFileSync(file, 'utf-8');

const btnStartIdx = code.indexOf('  .sys-menu-btn {\n    position: absolute;');
const btnEndStr = `    &:hover {
      background: rgba(255,255,255,0.05);
      color: #fff;
      border-color: $accent-gold;
      box-shadow: 0 0 8px rgba(234,179,8,0.2);
    }
  }`;
const btnEndIdx = code.indexOf(btnEndStr, btnStartIdx) + btnEndStr.length;

const btnCSS = code.substring(btnStartIdx, btnEndIdx);

// Remove the btn CSS from its current location
code = code.substring(0, btnStartIdx) + code.substring(btnEndIdx);

// Insert it just before .panel-layout
const panelLayoutIdx = code.indexOf('.panel-layout {');
code = code.substring(0, panelLayoutIdx) + btnCSS.replace(/  \.sys-menu-btn/g, '.sys-menu-btn') + '\n\n' + code.substring(panelLayoutIdx);

fs.writeFileSync(file, code);
console.log('Fixed CSS nesting');
