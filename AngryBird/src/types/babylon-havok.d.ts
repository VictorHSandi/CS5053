declare module "@babylonjs/havok" {
    interface HavokModule {
        [key: string]: unknown;
    }

    export default function HavokPhysics(...args: unknown[]): Promise<HavokModule>;
}
