import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    ScrollView,
    ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, CheckCircle2Icon, TicketPercent, X } from 'lucide-react-native';
import { useAuth } from '@/store/auth-store';
import { useI18n } from '@/store/i18n-store';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

const onboardingData = [
    {
        image: require('@/assets/images/onboard-1.png'),
        titleKey: 'onboarding.title1' as const,
        descriptionKey: 'onboarding.description1' as const,
    },
    {
        image: require('@/assets/images/onboard-2.png'),
        titleKey: 'onboarding.title2' as const,
        descriptionKey: 'onboarding.description2' as const,
    },
    {
        image: require('@/assets/images/onboard-3.png'),
        titleKey: 'onboarding.title3' as const,
        descriptionKey: 'onboarding.description3' as const,
    },
];

export default function OnboardingScreen() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);
    const { completeOnboarding } = useAuth();
    const { t } = useI18n();

    const handleNext = () => {
        if (currentIndex < onboardingData.length - 1) {
            const nextIndex = currentIndex + 1;
            setCurrentIndex(nextIndex);
            scrollViewRef.current?.scrollTo({
                x: nextIndex * width,
                animated: true,
            });
        } else {
            completeOnboarding();
            router.replace('/(auth)');
        }
    };

    const handleSkip = () => {
        completeOnboarding();
        router.replace('/(auth)');
    };

    const handleScroll = (event: any) => {
        const slideSize = event.nativeEvent.layoutMeasurement.width;
        const index = event.nativeEvent.contentOffset.x / slideSize;
        const roundIndex = Math.round(index);

        const distance = Math.abs(roundIndex - index);

        if (distance < 0.4) {
            setCurrentIndex(roundIndex);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.pagination}>
                    {onboardingData.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                index === currentIndex && styles.activeDot,
                            ]}
                        />
                    ))}
                </View>

                <TouchableOpacity style={styles.closeButton} onPress={handleSkip}>
                    <X color="#ffffff" size={24} />
                </TouchableOpacity>

            </View>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScroll}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollViewContent}
            >
                {onboardingData.map((item, index) => (
                    <View key={index} style={styles.slide}>
                        <ImageBackground
                            source={item.image}
                            style={styles.backgroundImage}
                            resizeMode="cover"
                        >
                            <View style={styles.overlay}>
                                <View style={styles.content}>
                                    <Text style={styles.title}>
                                        {t(item.titleKey)}
                                    </Text>
                                </View>
                            </View>
                        </ImageBackground>
                        <View style={styles.bottomContainer}>
                            <TouchableOpacity
                                style={styles.nextButton}
                                onPress={handleNext}
                            >
                                <View style={styles.nextButtonContent}>
                                    {/* <View style={styles.nextButtonInner} /> */}
                                    {
                                        onboardingData.indexOf(item) === onboardingData.length - 1 ? (
                                            <CheckCircle2Icon fill={"#000"} color={"#fff"} />
                                        ) : (
                                            <ArrowRight />
                                        )
                                    }
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                ))}
            </ScrollView>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        // position: "absolute",
        width: "100%"
    },
    header: {
        position: 'absolute',
        width: "100%",
        top: 40,
        left: 0,
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 20
    },
    closeButton: {
        zIndex: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        flexDirection: 'row',
    },
    slide: {
        width,
        height,
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'flex-end',
        paddingBottom: 120,
    },
    content: {
        paddingHorizontal: 32,
        alignItems: 'flex-start',
    },
    title: {
        fontSize: 25,
        fontWeight: '700',
        color: '#ffffff',
        lineHeight: 34,
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        fontWeight: '400',
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 22,
        textAlign: 'left',
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    pagination: {
        flexDirection: 'row',
        alignItems: 'center',
        position: "relative",
        left: 0,
        top: "auto",
        zIndex: 1999
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.4)',
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: '#ffffff',
        width: 20,
    },
    nextButton: {
        width: 150,
        height: 48,
        borderRadius: 50,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    nextButtonContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    nextButtonInner: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#000000',
    },
});
