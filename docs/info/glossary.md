# 术语表 (Glossary)

本页按字母顺序列出 OpenGL 开发中常见的术语。

## ARB

**OpenGL Architecture Review Board**（OpenGL 架构评审委员会）

负责 OpenGL 规范制定和扩展审批的组织。

## Buffer Object

**缓冲对象**

表示 GPU 中一段线性内存的对象。缓冲对象可用于存储顶点数据、索引数据、统一变量数据等。

## Drawing Command

**绘制命令**

任何形式为 `gl*Draw*` 的 OpenGL 函数，如 `glDrawArrays`、`glDrawElements` 等。这些函数将顶点发送到渲染管线。

## Context, OpenGL

**OpenGL 上下文**

OpenGL 状态、内存和资源的集合。执行任何 OpenGL 操作前必须创建上下文。

## GL

OpenGL 的简写。

## GLU

**GL Utility**（GL 工具库）

OpenGL 辅助库，已过时。

::: warning 已过时
建议使用现代工具替代 GLU。
:::

## GLUT

**GL Utility Toolkit**（GL 工具包）

用于创建 OpenGL 上下文和窗口的库，已过时。

::: warning 已过时
建议使用 FreeGLUT、GLFW、SDL 等现代替代方案。
:::

## GPU

**Graphics Processing Unit**（图形处理器）

专门用于图形处理的硬件单元。

## Interface Block

**接口块**

着色器中一组全局定义的集合，表示着色器阶段之间或着色器与缓冲对象之间的离散命名接口。

## Mipmap Level

**Mipmap 级别**

纹理中某一层 Mipmap 图像。

## Array Layer

**数组层**

数组纹理中某一索引处的图像。

## OpenGL

跨平台图形系统，具有公开可用的规范。

## OpenGL Context

**OpenGL 上下文**

表示 OpenGL 实例的对象，包含 OpenGL 的所有全局状态。可以创建和使用多个上下文。

## OpenGL ES

**OpenGL for Embedded Systems**（嵌入式系统 OpenGL）

面向移动设备等嵌入式系统的 OpenGL 规范子集。

## OpenGL Shading Language

**OpenGL 着色语言（GLSL）**

用于编写 OpenGL 着色器的语言。

## Rendering Command

**渲染命令**

OpenGL 渲染命令包括：

- 绘制命令（Drawing command）
- 帧缓冲块传输操作（Framebuffer blitting）
- 帧缓冲清除操作（Framebuffer clearing）
- 计算调度操作（Compute dispatch）

## Shader

**着色器**

使用 OpenGL 着色语言编写的程序，运行在 OpenGL 管线中。

## Texture

**纹理**

包含一个或多个图像的 OpenGL 对象，所有图像使用相同的图像格式存储。

## Vendor

**厂商**

OpenGL 实现的开发者（如 NVIDIA、AMD、Intel）。