import {
	BACK,
	COLOR_ATTACHMENT0,
	DEPTH_ATTACHMENT,
	DEPTH_STENCIL_ATTACHMENT,
	DRAW_BUFFER0,
	NONE,
	READ_BUFFER,
	RENDERBUFFER,
	STENCIL_ATTACHMENT
} from "../constants/constants.js";
import BadValueError from "../utility/BadValueError.js";
import type Context from "./Context.js";
import ContextDependent from "./internal/ContextDependent.js";
import type CubeFace from "../constants/CubeFace.js";
import FramebufferAttachment from "../constants/FramebufferAttachment.js";
import type FramebufferStatus from "../constants/FramebufferStatus.js";
import FramebufferTarget from "../constants/FramebufferTarget.js";
import MipmapTarget from "../constants/MipmapTarget.js";
import Renderbuffer from "./Renderbuffer.js";
import Texture from "./textures/Texture.js";
import type Texture2d from "./textures/Texture2d.js";
import type TextureCubemap from "./textures/TextureCubemap.js";
import UnsupportedOperationError from "../utility/UnsupportedOperationError.js";
import getExtensionsForFramebufferAttachmentFormat from "../utility/internal/getExtensionsForFramebufferAttachmentFormat.js";
import getMipmapTargetForCubeFace from "../utility/internal/getMipmapTargetForCubeFace.js";
import getParameterForFramebufferTarget from "../utility/internal/getParameterForFramebufferTarget.js";

/**
 * A portion of contiguous memory that contains a collection of buffers that store color, alpha, depth, and stencil information that is used to render an image.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGLFramebuffer | WebGLFramebuffer}
 * @public
 */
export default class Framebuffer extends ContextDependent {
	/**
	 * The currently-bound framebufferbuffer cache.
	 * @internal
	 */
	private static bindingsCache?: Map<
		WebGL2RenderingContext,
		Map<FramebufferTarget, WebGLFramebuffer | null>
	>;

	/**
	 * Get the framebuffer bindings cache.
	 * @returns The framebuffer bindings cache.
	 * @internal
	 */
	private static getBindingsCache() {
		return (Framebuffer.bindingsCache ??= new Map());
	}

	/**
	 * Get the framebuffer bindings cache for a rendering context.
	 * @param gl - The rendering context.
	 * @returns The framebuffer bindings cache.
	 * @internal
	 */
	private static getContextBindingsCache(gl: WebGL2RenderingContext) {
		// Get the full bindings cache.
		const bindingsCache = Framebuffer.getBindingsCache();

		// Get the context bindings cache.
		let contextBindingsCache = bindingsCache.get(gl);
		if (!contextBindingsCache) {
			contextBindingsCache = new Map();
			bindingsCache.set(gl, contextBindingsCache);
		}

		return contextBindingsCache;
	}

	/**
	 * Get the currently-bound framebuffer for a binding point.
	 * @param gl - The rendering context.
	 * @param target - The binding point. Note that `FRAMEBUFFER` will return the same value as `DRAW_FRAMEBUFFER`.
	 * @returns The framebuffer.
	 * @internal
	 */
	public static getBound(
		gl: WebGL2RenderingContext,
		target: FramebufferTarget
	) {
		// Get the context bindings cache.
		const contextBindingsCache = Framebuffer.getContextBindingsCache(gl);

		// Get the bound framebuffer.
		let boundFramebuffer = contextBindingsCache.get(target);
		if (typeof boundFramebuffer === "undefined") {
			boundFramebuffer = gl.getParameter(
				getParameterForFramebufferTarget(target)
			) as WebGLFramebuffer | null;
			contextBindingsCache.set(target, boundFramebuffer);
		}
		return boundFramebuffer;
	}

	/**
	 * Bind a framebuffer to a binding point.
	 * @param gl - The rendering context.
	 * @param target - The binding point.
	 * @param framebuffer - The framebuffer.
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/bindFramebuffer | bindFramebuffer}
	 * @internal
	 */
	public static bindGl(
		gl: WebGL2RenderingContext,
		target: FramebufferTarget,
		framebuffer: WebGLFramebuffer | null
	) {
		// Do nothing if the binding is already correct.
		if (Framebuffer.getBound(gl, target) === framebuffer) {
			return;
		}

		// Bind the framebuffer to the target.
		gl.bindFramebuffer(target, framebuffer);

		// Update the bindings cache.
		const contextBindingsCache = Framebuffer.getContextBindingsCache(gl);
		contextBindingsCache.set(target, framebuffer);
		switch (target) {
			case FramebufferTarget.FRAMEBUFFER:
				// For `FRAMEBUFFER`, update all binding points.
				contextBindingsCache.set(
					FramebufferTarget.READ_FRAMEBUFFER,
					framebuffer
				);
				contextBindingsCache.set(
					FramebufferTarget.DRAW_FRAMEBUFFER,
					framebuffer
				);
				break;
			case FramebufferTarget.DRAW_FRAMEBUFFER:
				// For `DRAW_FRAMEBUFFER`, update `FRAMEBUFFER` too (`FRAMEBUFFER_BINDING` always returns `DRAW_FRAMEBUFFER_BINDING`).
				contextBindingsCache.set(FramebufferTarget.FRAMEBUFFER, framebuffer);
				break;
			default: // Don't update anything else for `READ_FRAMEBUFFER`.
		}
	}

	/**
	 * Unbind the given framebuffer from the given binding point.
	 * @param gl - The rendering context.
	 * @param target - The binding point.
	 * @param framebuffer - The framebuffer, or `undefined` for any framebuffer.
	 * @internal
	 */
	public static unbindGl(
		gl: WebGL2RenderingContext,
		target: FramebufferTarget,
		framebuffer?: WebGLFramebuffer
	) {
		// Do nothing if the framebuffer is already unbound.
		if (framebuffer && Framebuffer.getBound(gl, target) !== framebuffer) {
			return;
		}

		// Unbind the framebuffer.
		Framebuffer.bindGl(gl, target, null);
	}

	/**
	 * Create a framebuffer.
	 * @param context - The rendering context.
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/createFramebuffer | createFramebuffer}
	 * @throws {@link UnsupportedOperationError} if a framebuffer cannot be created.
	 */
	public constructor(context: Context) {
		super(context);

		const framebuffer = this.gl.createFramebuffer();
		if (framebuffer === null) {
			throw new UnsupportedOperationError(
				"The environment does not support framebuffers."
			);
		}
		this.internal = framebuffer;
		this.targetCache = FramebufferTarget.FRAMEBUFFER;
		this.attachmentsCache = [];
	}

	/**
	 * The API interface of this framebuffer.
	 * @internal
	 */
	public readonly internal;

	/**
	 * The binding point of this framebuffer.
	 * @internal
	 */
	private targetCache;

	/**
	 * The binding point of this framebuffer.
	 * @internal
	 */
	public get target(): FramebufferTarget {
		return this.targetCache;
	}

	/** @internal */
	public set target(value) {
		if (this.target === value) {
			return;
		}

		this.unbind();
		this.targetCache = value;
	}

	/**
	 * The status of this framebuffer.
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/checkFramebufferStatus | checkFramebufferStatus}
	 */
	public get status(): FramebufferStatus {
		this.bind();
		return this.gl.checkFramebufferStatus(this.target);
	}

	/**
	 * Delete this framebuffer.
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/deleteFramebuffer | deleteFramebuffer}
	 */
	public delete(): void {
		this.gl.deleteFramebuffer(this.internal);
	}

	/**
	 * Bind this framebuffer to its binding point.
	 * @param target - The new binding point to bind to, or `undefined` for the previous binding point.
	 * @internal
	 */
	public bind(target?: FramebufferTarget) {
		if (target) {
			this.target = target;
		}

		Framebuffer.bindGl(this.gl, this.target, this.internal);
	}

	/**
	 * Unbind this framebuffer from its binding point.
	 * @internal
	 */
	public unbind() {
		Framebuffer.unbindGl(this.gl, this.target, this.internal);
	}

	/**
	 * The attachments on this framebuffer.
	 * @internal
	 */
	private readonly attachmentsCache: (Texture | Renderbuffer)[];

	/** The width of this framebuffer. */
	public get width(): number {
		const [firstAttachment] = this.attachmentsCache;
		return firstAttachment ? firstAttachment.width : 0;
	}

	/** The height of this framebuffer. */
	public get height(): number {
		const [firstAttachment] = this.attachmentsCache;
		return firstAttachment ? firstAttachment.height : 0;
	}

	/**
	 * Attach a 2D texture to this framebuffer.
	 * @param attachment - Specify the depth attachment, the stencil attachment, the depth stencil attachment, or the index of a color attachment.
	 * @param texture - The texture to attach.
	 * @param _ - An unused value.
	 * @param level - The level of the texture to attach. Defaults to the top level.
	 * @param layer - The layer of the texture to attach, or `undefined` for the entire texture.
	 * @throws {@link BadValueError} if the size of the texture does not match the size of any existing attachment to the framebuffer.
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/framebufferTexture2D | framebufferTexture2D}
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/framebufferTextureLayer | framebufferTextureLayer}
	 */
	public attach(
		attachment: FramebufferAttachment | number,
		texture: Texture2d,
		_?: never,
		level?: number,
		layer?: number
	): void;

	/**
	 * Attach a face of a cubemapped texture to this framebuffer.
	 * @param attachment - Specify the depth attachment, the stencil attachment, the depth stencil attachment, or the index of a color attachment.
	 * @param texture - The texture to attach.
	 * @param face - The face of the cubemapped texture to attach.
	 * @param level - The level of the texture to attach. Defaults to the top level.
	 * @param layer - The layer of the texture to attach, or `undefined` for the entire texture.
	 * @throws {@link BadValueError} if the size of the texture does not match the size of any existing attachment to the framebuffer.
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/framebufferTexture2D | framebufferTexture2D}
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/framebufferTextureLayer | framebufferTextureLayer}
	 */
	public attach(
		attachment: FramebufferAttachment | number,
		texture: TextureCubemap,
		face: CubeFace,
		level?: number,
		layer?: number
	): void;

	/**
	 * Attach a renderbuffer to this framebuffer.
	 * @param attachment - Specify the depth attachment, the stencil attachment, the depth stencil attachment, or the index of a color attachment.
	 * @param renderbuffer - The renderbuffer to attach.
	 * @throws {@link BadValueError} if the size of the renderbuffer does not match the size of any existing attachment to the framebuffer.
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/framebufferRenderbuffer | framebufferRenderbuffer}
	 */
	public attach(
		attachment: FramebufferAttachment | number,
		renderbuffer: Renderbuffer
	): void;

	public attach(
		attachment: FramebufferAttachment | number,
		data: Texture | Renderbuffer,
		face: CubeFace | undefined = void 0,
		level = 0,
		layer: number | undefined = void 0
	) {
		// Ensure that attachments are the same size.
		if (
			this.attachmentsCache.length > 0 &&
			(data.width !== this.width || data.height !== this.height)
		) {
			throw new BadValueError(
				"Framebuffer attachments must all be the same size."
			);
		}

		// Determine the actual WebGL constant value of the attachment.
		let attachmentValue = attachment;
		switch (attachment as FramebufferAttachment) {
			case FramebufferAttachment.Depth:
				attachmentValue = DEPTH_ATTACHMENT;
				break;
			case FramebufferAttachment.DepthStencil:
				attachmentValue = DEPTH_STENCIL_ATTACHMENT;
				break;
			case FramebufferAttachment.Stencil:
				attachmentValue = STENCIL_ATTACHMENT;
				break;
			default:
				attachmentValue += COLOR_ATTACHMENT0;
		}

		// Enable the extensions that are required for the attachment.
		if (data instanceof Texture) {
			for (const extension of getExtensionsForFramebufferAttachmentFormat(
				data.format
			)) {
				this.context.enableExtension(extension);
			}
		}

		// Bind this framebuffer.
		this.bind();

		// Attach the renderbuffer or texture.
		if (data instanceof Renderbuffer) {
			// Attach a renderbuffer.
			this.gl.framebufferRenderbuffer(
				this.target,
				attachmentValue,
				RENDERBUFFER,
				data.internal
			);
		} else if (typeof layer === "number") {
			// Attach a layer of a texture.
			this.gl.framebufferTextureLayer(
				this.target,
				attachmentValue,
				data.internal,
				level,
				layer
			);
		} else {
			// Get the mipmap binding point of the specified face. `undefined` means that a `Texture2d` is being used.
			const mipmapTarget = face
				? getMipmapTargetForCubeFace(face)
				: MipmapTarget.TEXTURE_2D;

			// Attach an entire texture.
			this.gl.framebufferTexture2D(
				this.target,
				attachmentValue,
				mipmapTarget,
				data.internal,
				0 // `level` must be zero.
			);
		}

		// Save a reference to the attachment.
		this.attachmentsCache.push(data);
	}

	/**
	 * The current read buffer.
	 * @internal
	 */
	private readBufferCache?: number | boolean;

	/**
	 * The current read buffer. `false` represents no buffer, `true` represents the back buffer, and an integer represents the corresponding color buffer.
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/readBuffer | readBuffer}
	 */
	public get readBuffer(): number | boolean {
		if (typeof this.readBufferCache !== "undefined") {
			return this.readBufferCache;
		}

		this.bind(FramebufferTarget.READ_FRAMEBUFFER);

		const raw = this.gl.getParameter(READ_BUFFER) as number;
		this.readBufferCache =
			raw === BACK ? true : raw === NONE ? false : raw - COLOR_ATTACHMENT0;
		return this.readBufferCache;
	}

	public set readBuffer(value) {
		if (this.readBuffer === value) {
			return;
		}

		this.bind(FramebufferTarget.READ_FRAMEBUFFER);

		this.gl.readBuffer(
			value === true ? BACK : value === false ? NONE : COLOR_ATTACHMENT0 + value
		);
		this.readBufferCache = value;
	}

	/**
	 * The current draw buffers.
	 * @internal
	 */
	private drawBuffersCache?: (number | boolean)[];

	/**
	 * The current draw buffers. `false` represents no buffer, `true` represents the back buffer, and an integer represents the corresponding color buffer.
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/drawBuffers | drawBuffers}
	 * @throws {@link BadValueError} if too many draw buffers are specified for the current environment.
	 */
	public get drawBuffers(): (number | boolean)[] {
		if (typeof this.drawBuffersCache !== "undefined") {
			return this.drawBuffersCache;
		}

		this.bind(FramebufferTarget.DRAW_FRAMEBUFFER);

		const out = [];
		for (let i = 0; i < this.context.maxDrawBuffers; i++) {
			const drawBuffer = this.gl.getParameter(DRAW_BUFFER0 + i) as number;
			out.push(
				drawBuffer === BACK
					? true
					: drawBuffer === NONE
						? false
						: drawBuffer - COLOR_ATTACHMENT0
			);
		}

		this.drawBuffersCache = out;
		return this.drawBuffersCache;
	}

	public set drawBuffers(value) {
		// Throw an error if too many buffers are specified.
		if (value.length > this.context.maxDrawBuffers) {
			throw new BadValueError(
				`Invalid draw buffers (${value.toString()} must have no more than ${this.context.maxDrawBuffers.toString()} elements).`
			);
		}

		// Reorder the input value so that WebGL doesn't warn.
		const realValue = [] as (number | boolean)[];
		for (const i of value) {
			if (typeof i === "number") {
				realValue[i] = i;
			}
		}
		for (let i = 0; i < this.context.maxDrawBuffers; i++) {
			realValue[i] ??= false;
		}

		// Compare the reordered input to the cached value.
		if (this.drawBuffers.length === realValue.length) {
			let matches = true;
			for (let i = 0; i < realValue.length; i++) {
				if (this.drawBuffers[i] !== realValue[i]) {
					matches = false;
					break;
				}
			}

			if (matches) {
				return;
			}
		}

		const out = [];
		for (const buffer of realValue) {
			out.push(
				typeof buffer === "number"
					? COLOR_ATTACHMENT0 + buffer
					: buffer
						? BACK
						: NONE
			);
		}

		this.bind(FramebufferTarget.DRAW_FRAMEBUFFER);

		this.gl.drawBuffers(out);
		this.drawBuffersCache = realValue;
	}
}
