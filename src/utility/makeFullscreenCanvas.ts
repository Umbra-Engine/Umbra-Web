import UnsupportedOperationError from "./UnsupportedOperationError.js";

const recursiveFullscreen = (element: HTMLElement) => {
	element.style.width = "100%";
	element.style.height = "100%";
	element.style.margin = "0px";
	element.style.padding = "0px";
	element.style.display = "block";

	if (element.parentElement) {
		recursiveFullscreen(element.parentElement);
	}
};

export default function makeFullscreenCanvas() {
	if (typeof document === "undefined") {
		throw new UnsupportedOperationError();
	}

	const canvas = document.createElement("canvas");
	canvas.style.touchAction = "none";

	document.body = document.createElement("body");
	document.body.appendChild(canvas);

	recursiveFullscreen(canvas);

	return canvas;
}
