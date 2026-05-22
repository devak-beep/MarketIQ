if(NOT TARGET react-native-reanimated::reanimated)
add_library(react-native-reanimated::reanimated SHARED IMPORTED)
set_target_properties(react-native-reanimated::reanimated PROPERTIES
    IMPORTED_LOCATION "/home/hello/Documents/My projects /MarketIQ/mobile/node_modules/react-native-reanimated/android/build/intermediates/prefab_package/release/prefab/modules/reanimated/libs/android.arm64-v8a/libreanimated.so"
    INTERFACE_INCLUDE_DIRECTORIES "/home/hello/Documents/My projects /MarketIQ/mobile/node_modules/react-native-reanimated/android/build/intermediates/prefab_package/release/prefab/modules/reanimated/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

if(NOT TARGET react-native-reanimated::worklets)
add_library(react-native-reanimated::worklets SHARED IMPORTED)
set_target_properties(react-native-reanimated::worklets PROPERTIES
    IMPORTED_LOCATION "/home/hello/Documents/My projects /MarketIQ/mobile/node_modules/react-native-reanimated/android/build/intermediates/prefab_package/release/prefab/modules/worklets/libs/android.arm64-v8a/libworklets.so"
    INTERFACE_INCLUDE_DIRECTORIES "/home/hello/Documents/My projects /MarketIQ/mobile/node_modules/react-native-reanimated/android/build/intermediates/prefab_package/release/prefab/modules/worklets/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

