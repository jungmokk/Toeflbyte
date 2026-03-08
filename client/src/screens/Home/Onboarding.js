import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, StatusBar, FlatList, TouchableOpacity, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../constants/theme';
import { Zap, Target, BookOpen, MessageSquare, ChevronRight } from 'lucide-react-native';
import AnimatedButton from '../../components/AnimatedButton';
import useStore from '../../store/useStore';

const { width } = Dimensions.get('window');

const Onboarding = ({ navigation }) => {
  const { t } = useTranslation();
  
  const SLIDES = [
    {
      id: '1',
      title: t('onboarding.slides.1.title'),
      description: t('onboarding.slides.1.description'),
      image: require('../../../assets/onboarding_1.png'),
      color: COLORS.primary,
    },
    {
      id: '2',
      title: t('onboarding.slides.2.title'),
      description: t('onboarding.slides.2.description'),
      image: require('../../../assets/onboarding_2.png'),
      color: COLORS.success,
    },
    {
      id: '3',
      title: t('onboarding.slides.3.title'),
      description: t('onboarding.slides.3.description'),
      image: require('../../../assets/onboarding_3.png'),
      color: COLORS.error,
    },
    {
      id: '4',
      title: t('onboarding.slides.4.title'),
      description: t('onboarding.slides.4.description'),
      icon: <Target color="#FFD700" size={64} />,
      color: "#FFD700",
      isLast: true,
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = React.useRef(null);
  const { setHasCompletedOnboarding } = useStore();

  const onViewableItemsChanged = React.useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      setHasCompletedOnboarding(true);
      navigation.replace('Main');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.slide}>
      <View style={[styles.iconContainer, { borderColor: item.color + '40' }]}>
        <View style={[styles.iconInner, { backgroundColor: item.color + '10' }]}>
          {item.image ? (
            <Image 
              source={item.image} 
              style={{ width: 140, height: 140, borderRadius: 20 }} 
              resizeMode="contain" 
            />
          ) : (
            item.icon
          )}
        </View>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={styles.logoText}>TOEFL <Text style={{color: COLORS.primary}}>BYTE</Text></Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        keyExtractor={(item) => item.id}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.dot, 
                { 
                  width: i === currentIndex ? 24 : 8,
                  backgroundColor: i === currentIndex ? COLORS.primary : 'rgba(255,255,255,0.2)' 
                }
              ]} 
            />
          ))}
        </View>

        <AnimatedButton 
          style={styles.button}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>
            {currentIndex === SLIDES.length - 1 ? t('onboarding.start') : t('onboarding.next')}
          </Text>
          <ChevronRight color={COLORS.white} size={20} />
        </AnimatedButton>
        
        {currentIndex < SLIDES.length - 1 && (
          <TouchableOpacity 
            style={styles.skipButton} 
            onPress={() => {
              setHasCompletedOnboarding(true);
              navigation.replace('Main');
            }}
          >
            <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E21', 
  },
  header: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    padding: 10,
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 42,
  },
  description: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 10,
  },
  footer: {
    padding: 30,
    paddingBottom: 40,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  button: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  skipText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  }
});

export default Onboarding;
