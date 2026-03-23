# 采样器对象 (Sampler Object)

采样器对象是存储纹理采样参数的 OpenGL 对象，用于着色器中的纹理访问。

**核心版本**：3.3  
**扩展**：`ARB_sampler_objects`

## 管理

采样器对象的标准管理函数：

```c
void glGenSamplers(GLsizei n, GLuint *samplers);
void glDeleteSamplers(GLsizei n, const GLuint *samplers);
GLboolean glIsSampler(GLuint sampler);
void glCreateSamplers(GLsizei n, GLuint *samplers);  // DSA
```

绑定到纹理单元：

```c
void glBindSampler(GLuint unit, GLuint sampler);
```

`unit` 是纹理单元索引（0 到 `GL_MAX_COMBINED_TEXTURE_IMAGE_UNITS` - 1）。

::: tip
修改采样器参数不需要绑定，参数设置函数直接接受采样器对象作为参数。仅在需要使用时绑定。
:::

### 参数设置

```c
void glSamplerParameteri(GLuint sampler, GLenum pname, GLint param);
void glSamplerParameterf(GLuint sampler, GLenum pname, GLfloat param);
void glSamplerParameteriv(GLuint sampler, GLenum pname, const GLint *params);
void glSamplerParameterfv(GLuint sampler, GLenum pname, const GLfloat *params);
void glSamplerParameterIiv(GLuint sampler, GLenum pname, const GLint *params);
void glSamplerParameterIuiv(GLuint sampler, GLenum pname, const GLuint *params);
```

当采样器对象绑定到纹理单元时，绑定到同一单元的纹理的内部采样参数将被**忽略**，采样参数来自采样器对象。

## 采样参数

### 过滤 (Filtering)

#### 放大过滤

`GL_TEXTURE_MAG_FILTER` 控制：

- `GL_NEAREST`：最近邻采样（点采样）
- `GL_LINEAR`：线性插值

#### 缩小过滤

`GL_TEXTURE_MIN_FILTER` 控制：

| 参数 | 级内线性 | 使用 Mipmap | 级间线性 |
|-----|---------|------------|---------|
| `GL_NEAREST` | ✗ | ✗ | - |
| `GL_LINEAR` | ✓ | ✗ | - |
| `GL_NEAREST_MIPMAP_NEAREST` | ✗ | ✓ | ✗ |
| `GL_LINEAR_MIPMAP_NEAREST` | ✓ | ✓ | ✗ |
| `GL_NEAREST_MIPMAP_LINEAR` | ✗ | ✓ | ✓ |
| `GL_LINEAR_MIPMAP_LINEAR` | ✓ | ✓ | ✓ |

::: info 术语说明
OpenGL 不使用"双线性"和"三线性"术语，因为这些术语与纹理维度相关：
- `GL_LINEAR` 在 1D 纹理上是单线性，在 2D 纹理上是双线性，在 3D 纹理上是三线性
- 通常"三线性"指 2D 纹理的 `GL_LINEAR_MIPMAP_LINEAR`
:::

#### 各向异性过滤

**核心版本**：4.6  
**扩展**：`ARB_texture_filter_anisotropic`, `EXT_texture_filter_anisotropic`

```c
glSamplerParameterf(sampler, GL_TEXTURE_MAX_ANISOTROPY, 16.0f);
```

值范围：1.0 到 `GL_MAX_TEXTURE_MAX_ANISOTROPY`。建议配合 `GL_LINEAR_MIPMAP_LINEAR` 使用。

#### LOD 控制

- `GL_TEXTURE_MIN_LOD`：最小 LOD 值
- `GL_TEXTURE_MAX_LOD`：最大 LOD 值
- `GL_TEXTURE_LOD_BIAS`：LOD 偏移量

### 深度比较模式

深度纹理可以以两种方式采样：

1. **普通模式**：返回深度值
2. **比较模式**：与参考值比较，返回比较结果

启用比较模式：

```c
glSamplerParameteri(sampler, GL_TEXTURE_COMPARE_MODE, GL_COMPARE_REF_TO_TEXTURE);
glSamplerParameteri(sampler, GL_TEXTURE_COMPARE_FUNC, GL_LESS);
```

比较函数：`GL_NEVER`、`GL_ALWAYS`、`GL_LESS`、`GL_LEQUAL`、`GL_EQUAL`、`GL_NOT_EQUAL`、`GL_GEQUAL`、`GL_GREATER`。

比较模式在 GLSL 中使用 `sampler2DShadow` 等阴影采样器类型。使用线性过滤时返回通过比较的邻近纹素比例（Percentage Closer Filtering）。

### 边界采样模式

纹理坐标可以超出 [0, 1] 范围，通过以下参数控制边界行为：

- `GL_TEXTURE_WRAP_S`：S 坐标边界模式
- `GL_TEXTURE_WRAP_T`：T 坐标边界模式
- `GL_TEXTURE_WRAP_R`：R 坐标边界模式

| 模式 | 说明 |
|-----|------|
| `GL_REPEAT` | 重复（循环） |
| `GL_MIRRORED_REPEAT` | 镜像重复 |
| `GL_CLAMP_TO_EDGE` | 钳制到边缘 |
| `GL_CLAMP_TO_BORDER` | 钳制到边界颜色 |
| `GL_MIRROR_CLAMP_TO_EDGE` | 镜像后钳制到边缘（GL 4.4） |

#### 边界颜色

使用 `GL_CLAMP_TO_BORDER` 时需设置边界颜色：

```c
GLfloat borderColor[] = {1.0f, 1.0f, 1.0f, 1.0f};
glSamplerParameterfv(sampler, GL_TEXTURE_BORDER_COLOR, borderColor);
```

边界颜色格式必须与纹理图像格式匹配：
- 浮点/归一化格式 → 使用浮点值
- 整数格式 → 使用整数版本函数 (`Iiv`/`Iuiv`)

### 无缝立方体贴图

**扩展**：`ARB_seamless_cubemap_per_texture`

```c
glSamplerParameteri(sampler, GL_TEXTURE_CUBE_MAP_SEAMLESS, GL_TRUE);
```

启用后，过滤可以在立方体面之间进行，消除面边界处的接缝。

## 示例代码

```c
GLuint sampler;
glGenSamplers(1, &sampler);

glSamplerParameteri(sampler, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);
glSamplerParameteri(sampler, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
glSamplerParameteri(sampler, GL_TEXTURE_WRAP_S, GL_REPEAT);
glSamplerParameteri(sampler, GL_TEXTURE_WRAP_T, GL_REPEAT);
glSamplerParameterf(sampler, GL_TEXTURE_MAX_ANISOTROPY, 16.0f);

glBindSampler(0, sampler);  // 绑定到纹理单元 0
```
