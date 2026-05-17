import { Stack } from "expo-router";
import { PostCaptureScreen as PostCaptureScreenComponent } from "../src/components/PostCaptureScreen";

export default function PostCaptureScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "Post Capture",
          headerShown: true,
        }}
      />
      <PostCaptureScreenComponent />
    </>
  );
}