# 面剔除 (Face Culling)

三角形图元在所有变换步骤后具有特定的朝向（facing），由三个顶点的顺序及其在屏幕上的视觉顺序决定。根据朝向丢弃三角形的过程称为**面剔除**（Face Culling）。

## 缠绕顺序 (Winding Order)

绘制命令发出后，顶点按顶点规范提供的顺序处理。几何着色器（Geometry Shader）可改变顺序，细分评估着色器（Tessellation Evaluation Shader）可直接控制细分面片的顶点顺序。

在图元装配（Primitive Assembly）阶段，顶点组成图元时，其相对顺序被记录。三角形的顶点顺序结合视觉方向可判断三角形是从"正面"还是"背面"被观察。

缠绕顺序定义：
- **顺时针（CW）**：三个顶点按顺序绕三角形中心顺时针旋转
- **逆时针（CCW）**：三个顶点按顺序绕三角形中心逆时针旋转

哪个面被视为"正面"由以下函数控制：

```cpp
void glFrontFace(GLenum mode);
```

- `GL_CW`：顺时针为正面
- `GL_CCW`：逆时针为正面（默认值）

::: tip 非三角形图元
非三角形图元始终被视为正面。
:::

### 细分中的缠绕顺序

细分生成的抽象面片顶点的缠绕顺序由细分评估着色器通过布局选项控制（`cw` 或 `ccw`）。最终缠绕顺序取决于顶点位置如何被变换。

## 剔除设置 (Culling)

面剔除的主要用途是移除不可见的三角形，避免执行昂贵的光栅化和片段着色器操作。

考虑一个立方体：由 12 个三角形组成，其中 6 个朝向与另外 6 个相反。除非立方体透明，否则一半三角形总是被另一半遮挡。

启用面剔除：

```cpp
glEnable(GL_CULL_FACE);
```

选择要剔除的面：

```cpp
void glCullFace(GLenum mode);
```

- `GL_FRONT`：剔除正面
- `GL_BACK`：剔除背面（默认值）
- `GL_FRONT_AND_BACK`：剔除所有三角形

::: warning 区别
`GL_FRONT_AND_BACK` 仅剔除三角形，而 `glEnable(GL_RASTERIZER_DISCARD)` 会关闭所有图元的光栅化。
:::

## 片段着色器中的面朝向

片段着色器可检测图元的朝向。内置输入变量 `gl_FrontFacing`：

- `true`：图元为正面（或无朝向的图元）
- `false`：图元为背面