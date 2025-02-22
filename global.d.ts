// global.d.ts
import { type ThreeElement } from '@react-three/fiber'
import { ShaderMaterial } from 'three'

declare module '@react-three/fiber' {
  interface ThreeElements {
    grassMaterial: ThreeElement<typeof ShaderMaterial>
  }
}