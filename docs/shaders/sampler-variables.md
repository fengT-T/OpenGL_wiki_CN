# 采样器变量 (Sampler)

**采样器 (Sampler)** 是 GLSL 中的一类特殊变量类型。采样器变量必须是 `uniform` 或函数参数，每个采样器代表一个特定类型的纹理。

## 采样器类型

采样器类型分为三类，对应纹理图像格式的基础数据类型：

| 前缀 | 数据类型 | 说明 |
|-----|---------|-----|
| `sampler` | 浮点 | 默认前缀，无前缀 |
| `isampler` | 有符号整数 | 前缀 `i` |
| `usampler` | 无符号整数 | 前缀 `u` |

::: warning 类型匹配
采样器类型必须与纹理的图像格式匹配。例如，用 `usampler2D` 采样 `GL_R8I` 格式纹理，或用 `sampler1D` 采样 `GL_R8UI` 格式纹理，都会产生未定义值。
:::

### 基础采样器类型对照表

| GLSL 采样器 | OpenGL 枚举 | 纹理类型 |
|------------|-------------|---------|
| `gsampler1D` | `GL_TEXTURE_1D` | 1D 纹理 |
| `gsampler2D` | `GL_TEXTURE_2D` | 2D 纹理 |
| `gsampler3D` | `GL_TEXTURE_3D` | 3D 纹理 |
| `gsamplerCube` | `GL_TEXTURE_CUBE_MAP` | 立方体贴图 |
| `gsampler2DRect` | `GL_TEXTURE_RECTANGLE` | 矩形纹理 |
| `gsampler1DArray` | `GL_TEXTURE_1D_ARRAY` | 1D 数组纹理 |
| `gsampler2DArray` | `GL_TEXTURE_2D_ARRAY` | 2D 数组纹理 |
| `gsamplerCubeArray` | `GL_TEXTURE_CUBE_MAP_ARRAY` | 立方体数组纹理 |
| `gsamplerBuffer` | `GL_TEXTURE_BUFFER` | 缓冲纹理 |
| `gsampler2DMS` | `GL_TEXTURE_2D_MULTISAMPLE` | 多重采样纹理 |
| `gsampler2DMSArray` | `GL_TEXTURE_2D_MULTISAMPLE_ARRAY` | 多重采样数组纹理 |

> `g` 代表任意前缀（无、`i`、`u`）

### 阴影采样器

具有深度或深度-模板格式且启用了深度比较的纹理必须使用**阴影采样器**：

| GLSL 采样器 | OpenGL 枚举 |
|------------|-------------|
| `sampler1DShadow` | `GL_TEXTURE_1D` |
| `sampler2DShadow` | `GL_TEXTURE_2D` |
| `samplerCubeShadow` | `GL_TEXTURE_CUBE_MAP` |
| `sampler2DRectShadow` | `GL_TEXTURE_RECTANGLE` |
| `sampler1DArrayShadow` | `GL_TEXTURE_1D_ARRAY` |
| `sampler2DArrayShadow` | `GL_TEXTURE_2D_ARRAY` |
| `samplerCubeArrayShadow` | `GL_TEXTURE_CUBE_MAP_ARRAY` |

阴影采样器访问结果始终是 [0, 1] 范围的单个浮点值，表示通过深度比较的样本比例。

## 语言定义

采样器变量只能以两种方式定义：

```glsl
uniform sampler2D texture1;

void Function(in sampler2D myTexture);
```

采样器没有"值"，不能通过表达式设置，只能作为函数调用的直接参数传递。

## 纹理查找函数

### 纹理坐标

- **归一化坐标**：坐标范围 [0, 1]，与纹理尺寸无关
- **纹素空间坐标**：坐标范围 [0, size]，`size` 为纹理该维度大小

矩形纹理始终使用纹素空间坐标。引用数组层的坐标组件不归一化。

### 着色器阶段中的纹理查找

纹理采样不仅限于片段着色器。然而，非片段着色器阶段有限制：

**Mipmap 计算依赖隐式导数**，这只能在片段着色器中通过纹理坐标相对于窗口空间的变化率计算。在其他阶段，只能访问基础 mipmap 层级。

::: warning 非均匀控制流
在片段着色器中，如果纹理采样发生在非均匀控制流中（条件基于非常量 uniform 或输入变量），且纹理使用了 mipmap 或各向异性过滤，结果将是未定义的。

解决方案：
1. 重构代码，始终执行纹理采样但条件性使用结果
2. 使用 `dFdx`/`dFdy` 在均匀控制流中预先计算梯度，然后用 `textureGrad` 采样
:::

### 纹理尺寸获取

```glsl
ivec textureSize(gsampler sampler, int lod);
```

返回指定 LOD 层级的纹理尺寸。无 mipmap 的采样器类型不需要 `lod` 参数。

### Mipmap 层级查询

```glsl
int textureQueryLevels(gsampler sampler);
```

返回纹理可用的 mipmap 层级数。

### 基础纹理访问

```glsl
gvec texture(gsampler sampler, vec texCoord[, float bias]);
```

使用归一化纹理坐标采样。`bias` 参数仅限片段着色器使用。

### 偏移纹理访问

```glsl
gvec textureOffset(gsampler sampler, vec texCoord, ivec offset[, float bias]);
```

`offset` 必须是常量表达式，范围由 `GL_MIN_PROGRAM_TEXEL_OFFSET` 和 `GL_MAX_PROGRAM_TEXEL_OFFSET` 限定。

### 投影纹理访问

```glsl
gvec textureProj(gsampler sampler, vec projTexCoord[, float bias]);
```

纹理坐标除以最后一个分量后使用。阴影采样器的比较值位于倒数第二个分量，也会被除。

### LOD 纹理访问

```glsl
gvec textureLod(gsampler sampler, vec texCoord, float lod);
```

显式指定 mipmap LOD。LOD 0 表示基础层级。

::: tip
`textureLod` 不需要隐式导数，可在任何着色器阶段使用。
:::

### 梯度纹理访问

```glsl
gvec textureGrad(gsampler sampler, vec texCoord, gradvec dTdx, gradvec dTdy);
```

显式提供纹理坐标在窗口 X 和 Y 方向的变化梯度。不需要隐式导数。

### 纹理收集

```glsl
gvec4 textureGather(gsampler sampler, vec texCoord, int comp);
gvec4 textureGatherOffset(gsampler sampler, vec texCoord, ivec2 offset, int comp);
gvec4 textureGatherOffsets(gsampler sampler, vec texCoord, ivec2 offsets[4], int comp);
```

返回最近的四个纹素的指定分量，顺序为：X=左上，Y=右上，Z=右下，W=左下。

### 组合纹理访问

以下函数组合了上述功能：
- `textureProjOffset`
- `textureProjLod`
- `textureProjLodOffset`
- `textureProjGrad`
- `textureProjGradOffset`
- `textureLodOffset`
- `textureGradOffset`

参数按函数名中出现的顺序添加。

### 直接纹素获取

```glsl
gvec texelFetch(gsampler sampler, ivec texCoord[, int lod][, int sample]);
gvec texelFetchOffset(gsampler sampler, ivec texCoord, int lod, ivec offset);
```

使用非归一化纹素坐标直接获取纹素值，忽略采样器参数（如环绕模式）。

::: tip
这是唯一能接受多重采样和缓冲采样器的纹理函数。
:::

## 绑定纹理到采样器

### 传统绑定方式

```cpp
void glActiveTexture(GLenum textureUnit);
void glBindTexture(GLenum target, GLuint texture);
void glBindSampler(GLuint unit, GLuint sampler);
```

设置采样器 uniform 值：

```cpp
GLint loc = glGetUniformLocation(program, "baseImage");
glUseProgram(program);
glUniform1i(loc, 0);  // 使用纹理单元 0
```

### 着色器内绑定

::: info 版本要求
核心版本：4.2 | 扩展：`ARB_shading_language_420pack`
:::

```glsl
layout(binding = 0) uniform sampler2D diffuseTex;
```

### 直接状态访问

::: info 版本要求
核心版本：4.5 | 扩展：`ARB_direct_state_access`
:::

```cpp
void glBindTextureUnit(GLuint unit, GLuint texture);
```

### 示例代码

```cpp
glLinkProgram(program);
GLint baseImageLoc = glGetUniformLocation(program, "baseImage");
GLint normalMapLoc = glGetUniformLocation(program, "normalMap");

glUseProgram(program);
glUniform1i(baseImageLoc, 0);   // 纹理单元 0
glUniform1i(normalMapLoc, 2);   // 纹理单元 2

// 渲染时绑定纹理
glActiveTexture(GL_TEXTURE0 + 0);
glBindTexture(GL_TEXTURE_2D, objectBaseImage);
glBindSampler(0, linearFiltering);

glActiveTexture(GL_TEXTURE0 + 2);
glBindTexture(GL_TEXTURE_2D, objectNormalMap);
glBindSampler(2, linearFiltering);

glDraw*();
```

### 多重绑定

::: info 版本要求
核心版本：4.4 | 扩展：`ARB_multi_bind`
:::

```cpp
void glBindTextures(GLuint first, GLsizei count, const GLuint *textures);
void glBindSamplers(GLuint first, GLsizei count, const GLuint *samplers);
```

一次性绑定多个纹理或采样器对象到连续的纹理单元。
