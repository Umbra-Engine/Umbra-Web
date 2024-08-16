import MultipleValuedUniform from "./MultipleValuedUniform.js";
import type Program from "../../Program.js";

/**
 * A three-dimensional vector global variable in a shader program.
 * @internal
 */
export default abstract class Vector3Uniform extends MultipleValuedUniform {
	/**
	 * Create a scalar uniform.
	 * @param program - The shader program that the uniform belongs to.
	 * @param activeInfo - The information of the uniform.
	 * @throws {@link UnsupportedOperationError} if the location of the uniform cannot be retrieved.
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getUniformLocation | getUniformLocation}
	 * @internal
	 */
	public constructor(program: Program, activeInfo: WebGLActiveInfo) {
		super(program, activeInfo);
		this.valueCache = [0, 0, 0];
		this.vectorValueCache = [0, 0, 0];
	}

	/**
	 * The value that is stored in this vector uniform.
	 * @internal
	 */
	protected vectorValueCache: [number, number, number];

	/**
	 * Set the value of this uniform if the value is iterable.
	 * @param value - The value to pass to the uniform.
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/uniform | uniform[1234][uif][v]}
	 * @internal
	 */
	public override iterableSetter(value: Iterable<number>) {
		// Can only accept three values.
		const [x, y, z] = [...value];
		if (
			typeof x === "undefined" ||
			typeof y === "undefined" ||
			typeof z === "undefined" ||
			(x === this.vectorValueCache[0] &&
				y === this.vectorValueCache[1] &&
				z === this.vectorValueCache[2])
		) {
			return;
		}

		this.iterableSetterInternal(value);
		this.vectorValueCache = [x, y, z];
	}

	/**
	 * Set the value of this uniform if the value is iterable.
	 * @param value - The value to pass to the uniform.
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/uniform | uniform[1234][uif][v]}
	 * @internal
	 */
	public abstract iterableSetterInternal(value: Iterable<number>): void;
}
