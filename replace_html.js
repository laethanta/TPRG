const fs = require('fs');

let content = fs.readFileSync('src/index.yaml', 'utf8');

const regex = /    - 正则名称: "\[界面\]前端界面状态栏"[\s\S]*?(?=    - 正则名称|\s*酒馆助手:)/;

const replacement = `    - 正则名称: '[界面]前端界面状态栏'
      id: b50d0bed-ff40-4a25-9ada-14feb4283324
      启用: true
      查找表达式: <StatusPlaceHolderImpl/>
      内容: |-
        \`\`\`
        <body>
        <script>
        $('body').load('https://testingcf.jsdelivr.net/gh/StageDog/tavern_helper_template/dist/界面/状态栏/index.html')
        </script>
        </body>
        \`\`\`
      来源:
        用户输入: false
        AI输出: true
      作用于:
        仅格式显示: true
        仅格式提示词: false

`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/index.yaml', content, 'utf8');
