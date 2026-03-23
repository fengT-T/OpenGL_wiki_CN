# 调试工具 (Debugging Tools)

OpenGL 提供了多种调试工具，可以帮助开发者诊断和优化应用程序。

## Debug Output

Debug Output（调试输出）是 OpenGL 4.3 的核心功能，由 `KHR_debug` 扩展定义。它通过回调机制让应用程序接收驱动程序的通知，包括：

- GL 错误发生时的详细信息
- 使用慢速路径时的警告
- 性能优化建议
- 重要状态变化通知

::: tip 优势
相比传统的 `glGetError()` 轮询方式，Debug Output 更加高效，且支持为 GL 对象添加可读名称、插入自定义调试消息。
:::

启用方式：

```c
glEnable(GL_DEBUG_OUTPUT);
glEnable(GL_DEBUG_OUTPUT_SYNCHRONOUS);
glDebugMessageCallback(callback, userParam);
```

## RenderDoc

**官网**：https://renderdoc.org/

RenderDoc 是一款开源（MIT 许可证）的图形调试工具，支持：

- OpenGL 3.2+ Core Profile
- Vulkan、D3D 等其他图形 API
- Windows 和 Linux 平台

::: info 功能
支持帧捕获、纹理查看、着色器调试、管线状态检查等。
:::

## BuGLe

**官网**：https://www.opengl.org/sdk/tools/BuGLe/

BuGLe 是 GPLv2 许可的 OpenGL 调试工具套件，适用于类 UNIX 系统。

::: warning 已停止维护
2014 年 11 月官方宣布停止开发。
:::

## AMD CodeXL

**官网**：https://gpuopen.com/compute-product/codexl/

CodeXL 是 gDebugger 的继任者，支持 GPU 利用率分析、性能瓶颈定位。

::: warning 已停止维护
CodeXL 不再积极开发或提供支持。
:::

## APITrace

**官网**：https://github.com/apitrace/apitrace

APITrace 是开源的 API 追踪工具，支持 OpenGL 和 DirectX。工作流程：

1. 运行程序生成 trace 文件
2. 回放或分析 trace 文件

## GLIntercept

**官网**：https://github.com/dtrebilco/glintercept

GLIntercept 是 Windows 平台的 OpenGL 拦截工具，可检测：

- GL 错误
- 上下文创建前的函数调用
- 资源泄漏

使用方法：将 `OpenGL32.dll` 和 `gliConfig.ini` 复制到应用程序目录。

::: warning 限制
仅支持单 GL 上下文，仅限 Windows 平台，对 OpenGL 3.x+ 的支持有限。
:::

## GLSL-Debugger

**官网**：http://glsl-debugger.github.io/

GLSL-Debugger 是 glslDevil 的开源分支，支持逐行调试着色器代码，适用于 Linux 和 Windows。

## Xcode Tools

**官网**：https://developer.apple.com/xcode/

macOS 提供的调试工具：

- **OpenGL Driver Monitor**：驱动监控
- **OpenGL Profiler**：性能分析

## Vogl

**官网**：https://github.com/ValveSoftware/vogl

Vogl 由 RAD Game Tools 和 Valve 开发（MIT 许可证），是跨平台的 OpenGL 捕获/回放调试器。

## AMD GPU PerfStudio

**官网**：http://gpuopen.com/archive/gpu-perfstudio/

::: warning 已停止维护
GPU PerfStudio 不再维护。
:::

支持帧分析、纹理/缓冲/着色器查看，可在非 AMD 硬件上使用。

## NVIDIA Nsight Graphics

**官网**：https://developer.nvidia.com/nsight-graphics

Nsight Graphics 是 NVIDIA 的独立调试分析工具，支持：

- OpenGL、Vulkan、D3D
- Windows 和 Linux
- OpenVR、Oculus SDK
- 完整的 Debug Output API 支持

::: tip 推荐使用
使用命名调试组标记子帧处理段落，可轻松识别和性能分析帧捕获中的各个部分。
:::

## NVIDIA Nsight VSE

**官网**：https://www.nvidia.com/object/nsight.html

Nsight Visual Studio Edition 集成于 Visual Studio，支持 OpenGL/CUDA/D3D 调试分析。

Nsight Eclipse Edition 提供类似的 Linux 和 macOS 支持。

## Intel GPA

**官网**：https://software.intel.com/content/www/us/en/develop/tools/graphics-performance-analyzers.html

Intel Graphics Performance Analyzers 提供命令行和脚本接口，支持：

- 多帧流捕获
- 数据分析
- 报告生成
- 性能回归检测