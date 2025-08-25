// components/GradientRingLoader.tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
    size?: number; // outer diameter in px
    thickness?: number; // ring thickness in px
    colors?: string[]; // gradient colors
    duration?: number; // rotation duration in ms
    innerColor?: string; // color to fill the hollow center (set to your background color)
};

export default function GradientRingLoader({
    size = 80,
    thickness = 12,
    colors = ['#CCD58F', '#52A3EF', '#C96BFF', '#4DA977'],
    duration = 14000,
    innerColor = '#fff',
}: Props) {
    const spin = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // continuous rotation
        Animated.loop(
            Animated.timing(spin, {
                toValue: 1,
                duration,
                easing: Easing.cubic,
                useNativeDriver: true,
            })
        ).start();
    }, [spin, duration]);

    const rotate = spin.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const outer = size;
    const inner = Math.max(outer - thickness * 2, 0);

    return (
        <View style={[styles.wrapper, { width: outer, height: outer }]}>


            {/* rotating gradient ring */}
            <Animated.View
                style={[
                    {
                        width: outer,
                        height: outer,
                        borderRadius: outer / 2,
                        transform: [{ rotate }],
                    },
                ]}
            >
                <LinearGradient
                    colors={colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ width: outer, height: outer, borderRadius: outer / 2 }}
                />
            </Animated.View>

            {/* inner circle to create the hollow effect */}
            <View
                style={[
                    styles.inner,
                    {
                        width: inner,
                        height: inner,
                        borderRadius: inner / 2,
                        backgroundColor: innerColor,
                    },
                ]}
                pointerEvents="none"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    inner: {
        position: 'absolute',
        zIndex: 10,
    },
    glow: {
        position: 'absolute',
        zIndex: 0,
    },
});
