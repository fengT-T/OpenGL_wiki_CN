# OpenGL Wiki 本地化项目

本项目是 Khronos Group OpenGL Wiki 的中文本地化版本，使用 VitePress 构建。

## 项目结构

```
docs/
├── .vitepress/
│   └── config.js          # VitePress 配置文件
├── index.md               # 首页
├── objects/               # OpenGL 对象
│   ├── index.md          # OpenGL 对象概述
│   ├── buffers/          # 缓冲区对象
│   │   └── index.md
│   ├── textures/         # 纹理
│   │   └── index.md
│   ├── framebuffers/     # 帧缓冲对象
│   │   └── index.md
│   └── vao.md            # 顶点数组对象
├── pipeline/             # 渲染管线
│   └── index.md
└── shaders/              # 着色器
    └── index.md
```

## 本地开发

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run docs:dev
```

### 构建

```bash
npm run docs:build
```

## 目录结构说明

根据 `data.json` 中的层级结构，文档按照以下主题组织：

### OpenGL 对象 (/objects/)
- OpenGL 对象概述
- 缓冲区对象（VBO、UBO、SSBO、PBO）
- 顶点数组对象
- 纹理（存储、格式、采样器、立方体贴图、数组）
- 帧缓冲对象（默认帧缓冲、渲染缓冲、同步对象）
- 查询对象

### 渲染管线 (/pipeline/)
- 渲染管线概述
- 顶点规范与处理
- 顶点后处理
- 图元装配
- 光栅化
- 片段着色器
- 逐采样处理

### 着色器 (/shaders/)
- GLSL 概述
- SPIR-V
- 编译与链接
- 内省
- 各类着色器（顶点、细分、几何、片段、计算）

## 贡献指南

1. 原始数据位于 `data/` 目录的 HTML 文件中
2. 根据 `data.json` 的层级结构组织文档
3. 将 HTML 内容转换为 Markdown 格式
4. 保持技术准确性，同时确保中文表达流畅
5. 使用 VitePress 的特性（提示框、代码块、表格等）增强可读性

## 参考

- [OpenGL Wiki](https://www.khronos.org/opengl/wiki/)
- [VitePress 文档](https://vitepress.dev/)
- [Khronos Group](https://www.khronos.org/)

## 许可证

本项目遵循原 OpenGL Wiki 的许可证。
