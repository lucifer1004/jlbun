cmake_minimum_required(VERSION 3.15)
cmake_policy(SET CMP0091 NEW)
cmake_policy(SET CMP0042 NEW)

project(jlbun)

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)
set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} ${CMAKE_CURRENT_SOURCE_DIR}/cmake)

find_package(Julia REQUIRED)

set(HEADER_FILES)

set(SOURCE_FILES
  "c/wrapper.c"
)

add_library(${PROJECT_NAME} SHARED ${SOURCE_FILES} ${HEADER_FILES})
target_include_directories(${PROJECT_NAME} PRIVATE ${Julia_INCLUDE_DIRS})
target_link_directories(${PROJECT_NAME} PRIVATE ${Julia_LIBRARY_DIR})
target_link_libraries(${PROJECT_NAME} ${Julia_LIBRARY})
