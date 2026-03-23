项目是为了从 opengl wiki上 下载 html

链接数据保存在 @link.md 内，有层级结构，你把 @link.md 的内容结构化到 data.json，然后把下载的数据存到 @data/ 文件夹中

# 实现细节

用node实现下载，下载函数如下，以越过爬虫检查
``` js
fetch("https://wikis.khronos.org/opengl/Main_Page", {
  "headers": {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
    "cache-control": "max-age=0",
    "priority": "u=0, i",
    "sec-ch-ua": "\"Not-A.Brand\";v=\"24\", \"Chromium\";v=\"146\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Linux\"",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "same-origin",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1"
  },
  "referrer": "https://wikis.khronos.org/opengl/Main_Page?__cf_chl_tk=75nSSkzfv8ZvH2H3oOPgKBumjpZCzscpUfVz25a7L70-1774234600-1.0.1.1-WIy2ymDIHpXIjJUYLkL.IU19wL4ZfEJoix8t.BpPJQ8",
  "body": null,
  "method": "GET",
  "mode": "cors",
  "credentials": "include"
});
```
下载频率 1s 一个。

这是一个opengl_wiki 本地化项目，本项目采用vitepress：
原始数据是@data/文件夹中的html文件。输出的markdown放到 @docs/ 文件夹中，文件结构根据vitepress的使用习惯来。
层级结构在 @data.json 中。你需要根据层级结构输出目录索引。
你需要根据每个html文件提到的内容，输出一篇技术文章, 要求详略得当,语句通顺。
这是一个opengl_wiki 本地化项目，本项目采用vitepress
你根据 @data/OpenGL_Object.html 提到的内容，输出一篇技术文章 到 @docs/objects/index.md , 要求详略得当,语句通顺，而不是一比一翻译。对于专有的名词，你应该提供原文和翻译对照，例如Buffer Objects （缓冲区对象）
