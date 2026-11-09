// Remotion CLI config. GL backend comes from the GL env var (default "angle": GPU on Windows/macOS;
// use "swangle" or "swiftshader" on CPU-only CI runners). BROWSER_EXECUTABLE optionally points at a local Chrome.
import { Config } from "@remotion/cli/config";

Config.setChromiumOpenGlRenderer((process.env.GL as "angle" | "swangle" | "swiftshader" | "egl" | "vulkan" | undefined) ?? "angle");
if (process.env.BROWSER_EXECUTABLE) Config.setBrowserExecutable(process.env.BROWSER_EXECUTABLE);
Config.setVideoImageFormat("jpeg");
