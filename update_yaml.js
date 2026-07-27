const fs = require('fs');
let content = fs.readFileSync('src/index.yaml', 'utf8');

const regexVar = /(名称:\s*变量结构[\s\S]*?内容:\s*\|-\n\s*)([\s\S]*?)(?=\n\s*导出时携带:)/;
content = content.replace(regexVar, "$1import 'https://testingcf.jsdelivr.net/gh/laethanta/TRPG@main/dist/脚本/变量结构/index.js';");

const regexInt = /(名称:\s*拦截器[\s\S]*?内容:\s*\|-\n\s*)([\s\S]*?)(?=\n\s*导出时携带:)/;
content = content.replace(regexInt, "$1import 'https://testingcf.jsdelivr.net/gh/laethanta/TRPG@main/dist/脚本/拦截器/index.js';");

fs.writeFileSync('src/index.yaml', content, 'utf8');
console.log('Update complete!');