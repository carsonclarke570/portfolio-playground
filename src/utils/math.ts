import * as THREE from 'three'

export function lighten(c: THREE.Color, amt: number) {
    const oklab = linearSRGBToOKLAB(c)
    oklab.x = Math.max(Math.min(oklab.x + amt, 1.0), 0.0);
    return OKLABToLinearSRGB(oklab);
}

export function darken(c: THREE.Color, amt: number) {
    const oklab = linearSRGBToOKLAB(c)
    oklab.x = Math.min(Math.max(oklab.x - amt, 0.0), 1.0);
    return OKLABToLinearSRGB(oklab);
}

export function linearSRGBToOKLAB(c: THREE.Color): THREE.Vector3 {
    const l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
	const m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
	const s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;

    const l_ = Math.cbrt(l);
    const m_ = Math.cbrt(m);
    const s_ = Math.cbrt(s);

    return new THREE.Vector3(
        0.2104542553*l_ + 0.7936177850*m_ - 0.0040720468*s_,
        1.9779984951*l_ - 2.4285922050*m_ + 0.4505937099*s_,
        0.0259040371*l_ + 0.7827717662*m_ - 0.8086757660*s_,
    );
}

export function OKLABToLinearSRGB(c: THREE.Vector3): THREE.Color {
    const l_ = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
    const m_ = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
    const s_ = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;

    const l = l_*l_*l_;
    const m = m_*m_*m_;
    const s = s_*s_*s_;

    return new THREE.Color(
		+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
    );
}