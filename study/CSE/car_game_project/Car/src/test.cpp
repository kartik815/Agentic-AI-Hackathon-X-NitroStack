// #include <glad/glad.h>
// #include <GLFW/glfw3.h>
// #include <iostream>

// // Callback for resizing window
// void framebuffer_size_callback(GLFWwindow* window, int width, int height) {
//     glViewport(0, 0, width, height);
// }

// int main() {
//     // 1. Initialize GLFW
//     if (!glfwInit()) {
//         std::cout << "Failed to initialize GLFW\n";
//         return -1;
//     }

//     // 2. Set OpenGL version (IMPORTANT)
//     glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
//     glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
//     glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

//     // 3. Create Window
//     GLFWwindow* window = glfwCreateWindow(800, 600, "Car Game Test", NULL, NULL);
//     if (!window) {
//         std::cout << "Failed to create window\n";
//         glfwTerminate();
//         return -1;
//     }

//     glfwMakeContextCurrent(window);

//     // 4. Load OpenGL functions using GLAD
//     if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)) {
//         std::cout << "Failed to initialize GLAD\n";
//         return -1;
//     }

//     // 5. Set viewport
//     glViewport(0, 0, 800, 600);
//     glfwSetFramebufferSizeCallback(window, framebuffer_size_callback);

//     // 6. Render loop
//     while (!glfwWindowShouldClose(window)) {
//         // Clear screen
//         glClearColor(0.1f, 0.1f, 0.1f, 1.0f);
//         glClear(GL_COLOR_BUFFER_BIT);

//         // Swap buffers + poll events
//         glfwSwapBuffers(window);
//         glfwPollEvents();
//     }

//     // 7. Cleanup
//     glfwTerminate();
//     return 0;
// }