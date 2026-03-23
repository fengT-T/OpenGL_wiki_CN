# 像素缓冲对象（Pixel Buffer Object, PBO）

像素缓冲对象（PBO）是用于异步像素传输操作（Pixel Transfer Operations）的缓冲对象。

## 常见误解

### PBO 不是什么

::: warning 误解澄清
- **PBO 不连接到纹理**：它们仅用于执行像素传输，过程中使用的缓冲对象不会以任何方式与纹理连接。图像数据的存储仍在纹理中。
- **PBO 与帧缓冲对象（FBO）无关**：FBO 不是缓冲对象，PBO 是。FBO 用于离屏渲染，PBO 用于图像数据与用户之间的异步传输。
:::

## 用途

在标准像素传输操作中，像素传输函数在客户端内存不再使用之前不允许返回：

- **上传（像素解包）**：OpenGL 实现必须将内存复制到内部缓冲区以执行异步 DMA 传输
- **下载（像素打包）**：整个下载操作必须立即执行，如果源仍在使用（如渲染目标），会强制部分或完全刷新

通过让 OpenGL 管理用作像素传输源或目标的内存，OpenGL 可以在用户访问缓冲对象之前避免显式同步。这意味着应用程序可以在驱动程序下载或上传像素数据时执行其他操作。

## 工作原理

每个执行像素传输操作的函数都可以使用缓冲对象代替客户端内存：

- **上传操作（像素解包）**：使用绑定到 `GL_PIXEL_UNPACK_BUFFER` 的缓冲对象
- **下载操作（像素打包）**：使用绑定到 `GL_PIXEL_PACK_BUFFER` 的缓冲对象

只有当绑定到相应绑定点时，这些函数才使用缓冲对象。如果绑定了缓冲区，函数的指针参数不是指针，而是缓冲区起始位置的偏移量。

```cpp
// 传统方式（同步）
glReadPixels(0, 0, width, height, GL_RGBA, GL_UNSIGNED_BYTE, cpuData);

// 使用 PBO（异步）
glBindBuffer(GL_PIXEL_PACK_BUFFER, pbo);
glReadPixels(0, 0, width, height, GL_RGBA, GL_UNSIGNED_BYTE, 0);  // 偏移量 0

// 稍后读取
glBindBuffer(GL_PIXEL_PACK_BUFFER, pbo);
void* data = glMapBuffer(GL_PIXEL_PACK_BUFFER, GL_READ_ONLY);
// 使用数据...
glUnmapBuffer(GL_PIXEL_PACK_BUFFER);
```

## 优化策略

PBO 主要是一种性能优化手段。要正确利用它们，需要在等待传输完成时有其他事情可做。

### 上传优化

上传通常是"即发即忘"操作。PBO 在上传场景的优势较小，因为大多数 OpenGL 驱动程序已经通过将数据复制到内部内存来优化客户端像素传输。

优化要点：

1. **正确格式化数据**：使用高效的像素格式和类型
2. **避免覆盖正在上传的缓冲区**：使用多个缓冲区轮换或缓冲对象流技术
3. **批量上传**：可以将多个 mip 级别加载到缓冲区并连续传输

```cpp
// 使用流式上传
glBindBuffer(GL_PIXEL_UNPACK_BUFFER, pbo);
glBufferData(GL_PIXEL_UNPACK_BUFFER, size, NULL, GL_STREAM_DRAW);
void* ptr = glMapBufferRange(GL_PIXEL_UNPACK_BUFFER, 0, size, 
                              GL_MAP_WRITE_BIT | GL_MAP_INVALIDATE_BUFFER_BIT);
// 填充数据
glUnmapBuffer(GL_PIXEL_UNPACK_BUFFER);
glTexSubImage2D(GL_TEXTURE_2D, 0, 0, 0, width, height, 
                GL_RGBA, GL_UNSIGNED_BYTE, 0);
```

### 下载优化

这是 PBO 真正发挥性能优势的地方。

::: tip 关键点
如果下载渲染目标后立即清除并开始再次渲染，会引入管线停顿。OpenGL 必须等待 DMA 传输完成才能发出新的渲染命令。
:::

优化策略：

1. **使用同步对象**：使用 Fence Sync 检测传输是否完成，而不阻塞 CPU

```cpp
// 开始异步下载
glBindBuffer(GL_PIXEL_PACK_BUFFER, pbo);
glReadPixels(0, 0, width, height, GL_RGBA, GL_UNSIGNED_BYTE, 0);

// 创建同步对象
GLsync sync = glFenceSync(GL_SYNC_GPU_COMMANDS_COMPLETE, 0);

// 执行其他工作...

// 检查是否完成
GLenum result = glClientWaitSync(sync, 0, 0);
if (result == GL_ALREADY_SIGNALED) {
    // 数据已准备好
    void* data = glMapBuffer(GL_PIXEL_PACK_BUFFER, GL_READ_ONLY);
    // 处理数据
}
glDeleteSync(sync);
```

2. **使用多个渲染目标**：如果每帧都读取渲染目标，考虑使用两个渲染目标交替使用

3. **隐藏传输延迟**：在其他渲染过程中执行传输。例如，在渲染阴影贴图时，无法渲染到主目标，可以利用这段时间完成 DMA 传输

```cpp
// 场景：阴影贴图 + 主渲染目标读取
// 1. 渲染到主目标
// 2. 开始 PBO 下载
glBindBuffer(GL_PIXEL_PACK_BUFFER, pbo);
glReadPixels(...);

// 3. 渲染阴影贴图（这段时间主目标不会被修改）
renderShadowMap();

// 4. 阴影渲染完成后，PBO 数据可能已就绪
// 5. 使用 PBO 数据
```

## 参考

- 核心版本：OpenGL 2.1（`ARB_pixel_buffer_object`）
- 核心扩展：`ARB_pixel_buffer_object`
