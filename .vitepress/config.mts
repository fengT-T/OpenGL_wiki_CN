import { defineConfig } from "vitepress";

export default defineConfig({
  title: "OpenGL Wiki",
  description: "OpenGL 官方文档的中文本地化版本",
  lang: "zh-CN",
  srcDir: "./docs",
  outDir: "./dist",
  themeConfig: {
    nav: [
      { text: "首页", link: "/" },
      { text: "OpenGL 对象", link: "/objects/" },
      { text: "渲染管线", link: "/pipeline/" },
      { text: "着色器", link: "/shaders/" },
      { text: "概念", link: "/concepts/" },
      { text: "其他信息", link: "/info/" },
    ],

    sidebar: {
      "/objects/": [
        {
          text: "OpenGL 对象",
          items: [{ text: "概述", link: "/objects/" }],
        },
        {
          text: "缓冲区对象 (Buffer Objects)",
          collapsed: true,
          items: [
            { text: "概述", link: "/objects/buffers/" },
            { text: "顶点缓冲对象 (VBO)", link: "/objects/buffers/vbo" },
            { text: "统一缓冲对象 (UBO)", link: "/objects/buffers/ubo" },
            {
              text: "着色器存储缓冲对象 (SSBO)",
              link: "/objects/buffers/ssbo",
            },
            { text: "像素缓冲对象 (PBO)", link: "/objects/buffers/pbo" },
          ],
        },
        {
          text: "顶点数组对象 (VAO)",
          items: [{ text: "顶点数组对象", link: "/objects/vao" }],
        },
        {
          text: "纹理 (Textures)",
          collapsed: true,
          items: [
            { text: "概述", link: "/objects/textures/" },
            { text: "纹理存储", link: "/objects/textures/storage" },
            { text: "图像格式", link: "/objects/textures/formats" },
            { text: "采样器对象", link: "/objects/textures/sampler" },
            { text: "立方体贴图", link: "/objects/textures/cubemap" },
            { text: "纹理数组", link: "/objects/textures/array" },
          ],
        },
        {
          text: "查询对象 (Query Objects)",
          items: [{ text: "异步查询对象", link: "/objects/query" }],
        },
        {
          text: "帧缓冲对象 (FBO)",
          collapsed: true,
          items: [
            { text: "概述", link: "/objects/framebuffers/" },
            {
              text: "默认帧缓冲",
              link: "/objects/framebuffers/default-framebuffer",
            },
            {
              text: "渲染缓冲对象",
              link: "/objects/framebuffers/renderbuffer",
            },
          ],
        },
        {
          text: "非常规对象",
          collapsed: true,
          items: [
            { text: "同步对象 (Sync Object)", link: "/objects/sync-object" },
            { text: "着色器与程序对象", link: "/shaders/glsl-object" },
          ],
        },
      ],
      "/pipeline/": [
        {
          text: "渲染管线",
          items: [{ text: "概述", link: "/pipeline/" }],
        },
        {
          text: "顶点规范 (Vertex Specification)",
          collapsed: true,
          items: [
            { text: "概述", link: "/pipeline/vertex-specification" },
            { text: "顶点渲染", link: "/pipeline/vertex-rendering" },
            { text: "图元", link: "/pipeline/primitive" },
          ],
        },
        {
          text: "顶点处理 (Vertex Processing)",
          collapsed: true,
          items: [
            { text: "概述", link: "/pipeline/vertex-processing" },
            { text: "顶点着色器", link: "/shaders/vertex" },
            { text: "细分着色器", link: "/shaders/tessellation" },
            { text: "几何着色器", link: "/shaders/geometry" },
          ],
        },
        {
          text: "顶点后处理 (Vertex Post-Processing)",
          collapsed: true,
          items: [
            { text: "概述", link: "/pipeline/vertex-post-processing" },
            { text: "变换反馈", link: "/pipeline/transform-feedback" },
          ],
        },
        {
          text: "图元装配 (Primitive Assembly)",
          collapsed: true,
          items: [
            { text: "概述", link: "/pipeline/primitive-assembly" },
            { text: "面剔除", link: "/pipeline/face-culling" },
          ],
        },
        {
          text: "光栅化 (Rasterization)",
          items: [{ text: "概述", link: "/pipeline/rasterization" }],
        },
        {
          text: "片段着色器 (Fragment Shader)",
          items: [{ text: "概述", link: "/shaders/fragment" }],
        },
        {
          text: "逐采样处理 (Per-Sample Processing)",
          collapsed: true,
          items: [
            { text: "概述", link: "/pipeline/per-sample-processing" },
            { text: "深度测试", link: "/pipeline/depth-test" },
            { text: "混合", link: "/pipeline/blending" },
          ],
        },
      ],
      "/shaders/": [
        {
          text: "OpenGL 着色语言",
          items: [{ text: "概述", link: "/shaders/" }],
        },
        {
          text: "着色器基础",
          collapsed: true,
          items: [
            { text: "着色器对象", link: "/shaders/glsl-object" },
            { text: "编译与链接", link: "/shaders/compilation" },
            { text: "程序内省", link: "/shaders/introspection" },
          ],
        },
        {
          text: "核心语言",
          items: [{ text: "核心语言", link: "/shaders/core-language" }],
        },
        {
          text: "变量类型",
          collapsed: true,
          items: [
            { text: "数据类型", link: "/shaders/data-types" },
            { text: "类型限定符", link: "/shaders/type-qualifiers" },
            { text: "布局限定符", link: "/shaders/layout-qualifiers" },
            { text: "Uniform 变量", link: "/shaders/uniform-variables" },
            { text: "采样器变量", link: "/shaders/sampler-variables" },
          ],
        },
        {
          text: "内置变量",
          items: [{ text: "内置变量", link: "/shaders/built-in-variables" }],
        },
        {
          text: "接口块",
          items: [{ text: "接口块", link: "/shaders/interface-blocks" }],
        },
        {
          text: "SPIR-V",
          items: [{ text: "SPIR-V", link: "/shaders/spirv" }],
        },
        {
          text: "着色器阶段",
          collapsed: true,
          items: [
            { text: "顶点着色器", link: "/shaders/vertex" },
            { text: "细分着色器", link: "/shaders/tessellation" },
            { text: "几何着色器", link: "/shaders/geometry" },
            { text: "片段着色器", link: "/shaders/fragment" },
            { text: "计算着色器", link: "/shaders/compute" },
          ],
        },
      ],
      "/concepts/": [
        {
          text: "OpenGL 概念",
          items: [{ text: "概述", link: "/concepts/" }],
        },
        {
          text: "OpenGL 上下文",
          collapsed: true,
          items: [
            { text: "概述", link: "/concepts/opengl-context" },
            { text: "上下文类型", link: "/concepts/core-and-compatibility" },
            { text: "同步", link: "/concepts/synchronization" },
            { text: "获取上下文信息", link: "/concepts/get-context-info" },
          ],
        },
        {
          text: "OpenGL 规范",
          collapsed: true,
          items: [
            { text: "规范概述", link: "/concepts/opengl-specification" },
            { text: "架构评审委员会", link: "/concepts/opengl-arb" },
          ],
        },
        {
          text: "OpenGL 扩展",
          items: [{ text: "扩展概述", link: "/concepts/opengl-extension" }],
        },
        {
          text: "遗留 OpenGL",
          items: [{ text: "遗留 OpenGL", link: "/concepts/legacy-opengl" }],
        },
        {
          text: "OpenGL 历史",
          collapsed: true,
          items: [
            { text: "历史概述", link: "/concepts/history" },
            {
              text: "可编程性历史",
              link: "/concepts/history-of-programmability",
            },
          ],
        },
      ],
      "/info/": [
        {
          text: "其他有用信息",
          items: [{ text: "概述", link: "/info/" }],
        },
        {
          text: "调试工具",
          items: [{ text: "调试工具", link: "/info/debugging-tools" }],
        },
        {
          text: "实用 3D 算法",
          items: [{ text: "数学与算法", link: "/info/math-and-algorithms" }],
        },
        {
          text: "平台相关问题",
          items: [{ text: "平台特定问题", link: "/info/platform-specific" }],
        },
        {
          text: "硬件相关问题",
          items: [{ text: "硬件特定问题", link: "/info/hardware-specific" }],
        },
        {
          text: "术语表",
          items: [{ text: "术语表", link: "/info/glossary" }],
        },
      ],
    },

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/KhronosGroup/OpenGL-Refpages",
      },
    ],

    footer: {
      message: "基于 OpenGL Wiki 的本地化项目",
      copyright: "Copyright © 2024 Khronos Group",
    },
  },
});
