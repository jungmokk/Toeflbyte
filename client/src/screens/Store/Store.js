import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../../constants/theme';
import { X, Zap, Crown, Award, Check, Sparkles } from 'lucide-react-native';
import useStore from '../../store/useStore';
import useUser from '../../hooks/useUser';
import AnimatedButton from '../../components/AnimatedButton';
import { useTranslation } from 'react-i18next';
import { 
  useIAP,
  PurchaseError,
  ErrorCode
} from 'react-native-iap';

const SKUS = Platform.select({
  android: ['pack_basic', 'pack_pro', 'pack_master'],
  ios: ['pack_basic', 'pack_pro', 'pack_master'],
});

const SUBS = Platform.select({
  android: ['premium_monthly', 'premium_yearly'],
  ios: ['premium_monthly', 'premium_yearly'],
});

const Store = ({ navigation }) => {
  const { credits, isPremium } = useStore();
  const { rechargeCredits, upgradePremium, syncUser } = useUser();
  const { t } = useTranslation();
  const {
    connected,
    products,
    subscriptions,
    fetchProducts,
    getSubscriptions,
    finishTransaction,
    requestPurchase,
    requestSubscription,
    getAvailablePurchases,
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      try {
        const receipt = purchase.transactionReceipt;
        if (receipt) {
          setLoadingCode(purchase.productId);
          let result;
          const isSub = SUBS.includes(purchase.productId);
          
          if (isSub) {
            result = await upgradePremium(purchase.productId, receipt);
          } else {
            const pkg = packages.find(p => p.id === purchase.productId);
            result = await rechargeCredits(pkg ? pkg.credits + pkg.bonus : 0, purchase.productId, receipt);
          }

          if (result && result.success) {
            await finishTransaction({ purchase });
            Alert.alert(t('common.success'), t('store.purchaseSuccess'));
            await syncUser();
          }
        }
      } catch (err) {
        console.error('[Purchase-Verify-Error]', err);
        Alert.alert(t('common.error'), t('store.verifyFailed'));
      } finally {
        setLoadingCode(null);
      }
    },
    onPurchaseError: (error) => {
      setLoadingCode(null);
      // v14에서는 instanceof PurchaseError 대신 직접 property 체크를 권장합니다.
      if (error && error.code) {
        if (error.code !== 'E_USER_CANCELLED') {
          console.warn('[Purchase-Error]', error);
          Alert.alert(t('common.error'), error.message || t('store.purchaseError'));
        }
      } else if (error) {
        console.error('[Unknown-Purchase-Error]', error);
        Alert.alert(t('common.error'), error.message || "An unknown error occurred.");
      }
    }
  });
  
  const [loadingCode, setLoadingCode] = useState(null);

  // Initialize and fetch products
  useEffect(() => {
    let isMounted = true;

    const initIAP = async () => {
      try {
        if (connected) {
          console.log('[Store] IAP Connected. Fetching products...');
          // Fetch products and subscriptions using specialized methods for v14+
          await Promise.all([
            fetchProducts({ skus: SKUS }),
            getSubscriptions({ skus: SUBS })
          ]);
          console.log('[Store] Items loaded successfully.');
        } else {
          console.log('[Store] IAP not connected yet.');
        }
      } catch (err) {
        if (isMounted) {
          console.error('[IAP-Init-Error]', err);
        }
      }
    };
    initIAP();

    return () => { isMounted = false; };
  }, [connected]);

  const handleRestore = async () => {
    try {
      setLoadingCode('restore');
      const available = await getAvailablePurchases();
      if (available && available.length > 0) {
        // Sync the latest purchase (simplification for MVP)
        const lastPurchase = available[available.length - 1];
        const receipt = lastPurchase.transactionReceipt;
        if (receipt) {
          const isSub = SUBS.includes(lastPurchase.productId);
          let result;
          if (isSub) {
            result = await upgradePremium(lastPurchase.productId, receipt);
          } else {
            const pkg = packages.find(p => p.id === lastPurchase.productId);
            result = await rechargeCredits(pkg ? pkg.credits + pkg.bonus : 0, lastPurchase.productId, receipt);
          }
          
          if (result && result.success) {
            Alert.alert(t('common.success'), t('store.restore_success') || "Purchases restored successfully!");
            await syncUser();
          }
        }
      } else {
        Alert.alert(t('store.restore_title') || "Restore Purchases", t('store.no_purchases') || "No previous purchases found.");
      }
    } catch (err) {
      console.error('[Restore-Error]', err);
      Alert.alert(t('common.error'), t('store.restore_failed') || "Failed to restore purchases.");
    } finally {
      setLoadingCode(null);
    }
  };



  const packages = [
    {
      id: 'pack_basic',
      title: 'Basic Pack',
      credits: 100,
      price: '$1.99',
      bonus: 0,
      icon: <Zap color={COLORS.primary} size={32} />,
      color: COLORS.primary
    },
    {
      id: 'pack_pro',
      title: 'Pro Pack',
      credits: 500,
      price: '$8.99',
      bonus: 25,
      popular: true,
      icon: <Crown color="#FFD700" size={32} />,
      color: '#FFD700'
    },
    {
      id: 'pack_master',
      title: 'Master Pack',
      credits: 1200,
      price: '$19.99',
      bonus: 100,
      bestValue: true,
      icon: <Award color="#00E676" size={32} />,
      color: '#00E676'
    }
  ];

  const subPackages = [
    {
      id: 'premium_monthly',
      title: 'Monthly Pass',
      price: '$9.99/mo',
      description: 'Full access + 500 bonus credits',
      icon: <Sparkles color={COLORS.primary} size={28} />
    },
    {
      id: 'premium_yearly',
      title: 'Yearly Pass',
      price: '$79.99/yr',
      description: 'Save 30% + 2000 bonus credits',
      icon: <Crown color="#FFD700" size={28} />,
      popular: true
    }
  ];

  const handlePurchaseRequest = async (sku, isSub = false) => {
    if (!connected) {
      Alert.alert(t('common.error'), t('store.notConnected') || "Store not connected. Please try again.");
      return;
    }
    
    setLoadingCode(sku);
    try {
      if (isSub) {
        console.log(`[IAP] Requesting subscription for: ${sku}`);
        const sub = subscriptions.find(s => s.productId === sku);
        
        if (Platform.OS === 'android') {
          // v14+ sub object contains subscriptionOfferDetails for each base plan/offer
          const subDetails = sub?.subscriptionOfferDetails || [];

          if (!sub || subDetails.length === 0) {
            console.error('[IAP] No offer details found for sub SKU:', sku, JSON.stringify(sub, null, 2));
            throw new Error(`[${sku}] Subscription offer details not found. Please ensure a Base Plan is ACTIVE in Google Play Console.`);
          }
          
          // Find the best offer (usually the one with the least discount or just the first one)
          // For most cases, the first one is the default base plan
          const offerToken = subDetails[0].offerToken;

          if (!offerToken) {
            console.error('[IAP] Offer token is missing for sub SKU:', sku, JSON.stringify(sub, null, 2));
            throw new Error('Subscription offer token not found.');
          }

          console.log(`[IAP] Requesting subscription for ${sku} with token: ${offerToken.substring(0, 20)}...`);
          
          await requestSubscription({
            sku,
            subscriptionOffers: [{ sku, offerToken }],
          });
        } else {
          // iOS v14 pattern
          await requestSubscription({
            request: {
              ios: {
                sku,
                andDangerouslyFinishTransactionAutomatically: false
              }
            }
          });
        }
      } else {
        console.log(`[IAP] Requesting purchase for: ${sku}`);
        if (Platform.OS === 'android') {
          await requestPurchase({
            request: {
              android: {
                skus: [sku]
              }
            }
          });
        } else {
          await requestPurchase({
            request: {
              ios: {
                sku,
                andDangerouslyFinishTransactionAutomaticallyIOS: false
              }
            }
          });
        }
      }
    } catch (err) {
      setLoadingCode(null);
      console.error('[Purchase-Request-Error]', err);
      const msg = err instanceof Error ? err.message : "Purchase request failed.";
      Alert.alert(t('common.error'), msg);
    }
  };

  const getPriceBySku = (sku, fallback) => {
    const item = [...products, ...subscriptions].find(p => p.productId === sku);
    return item ? item.localizedPrice : fallback;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <X color={COLORS.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('store.title')}</Text>
        <View style={styles.balanceBadge}>
          <Zap color="#FFD700" size={14} fill="#FFD700" />
          <Text style={styles.balanceText}>{credits}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.heroIconContainer}>
            <Zap color={COLORS.primary} size={48} fill={COLORS.primary} />
          </View>
          <Text style={styles.heroTitle}>{t('store.hero_title')}</Text>
          <Text style={styles.heroSubtitle}>{t('store.hero_subtitle')}</Text>
          
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Check color={COLORS.success} size={16} />
              <Text style={styles.featureText}>{t('store.feature_db')}</Text>
            </View>
            <View style={styles.featureItem}>
              <Check color={COLORS.success} size={16} />
              <Text style={styles.featureText}>{t('store.feature_ai')}</Text>
            </View>
            <View style={styles.featureItem}>
              <Check color={COLORS.success} size={16} />
              <Text style={styles.featureText}>{t('store.feature_note')}</Text>
            </View>
          </View>
        </View>

        {/* Subscriptions Section */}
        <Text style={styles.sectionTitle}>{t('store.pass_section')}</Text>
        <View style={styles.subList}>
          {subPackages.map((sub) => (
            <AnimatedButton 
              key={sub.id}
              style={[styles.subCard, sub.popular && styles.popularCard]}
              onPress={() => handlePurchaseRequest(sub.id, true)}
              disabled={loadingCode !== null || isPremium}
            >
              <View style={styles.subIconWrap}>{sub.icon}</View>
              <View style={styles.packageInfo}>
                <Text style={styles.packageTitle}>{sub.title}</Text>
                <Text style={styles.subPrice}>{getPriceBySku(sub.id, sub.price)}</Text>
                <Text style={styles.subDesc}>{sub.description}</Text>
              </View>
              {isPremium ? (
                <View style={styles.activeLabel}><Text style={styles.activeText}>{t('store.using')}</Text></View>
              ) : (
                <View style={styles.priceBtn}>
                  {loadingCode === sub.id ? (
                    <ActivityIndicator color={COLORS.white} size="small" />
                  ) : (
                    <Text style={styles.priceBtnText}>{t('store.subscribe')}</Text>
                  )}
                </View>
              )}
            </AnimatedButton>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t('store.credit_section')}</Text>
        <View style={styles.packageList}>
          {packages.map((pkg) => (
            <AnimatedButton 
              key={pkg.id}
              style={[
                styles.packageCard,
                pkg.popular && styles.popularCard,
                pkg.bestValue && styles.bestValueCard
              ]}
              onPress={() => handlePurchaseRequest(pkg.id)}
              disabled={loadingCode !== null}
            >
              {pkg.popular && (
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>MOST POPULAR</Text>
                </View>
              )}
              {pkg.bestValue && (
                <View style={[styles.badgeContainer, { backgroundColor: pkg.color }]}>
                  <Text style={styles.badgeText}>BEST VALUE</Text>
                </View>
              )}

              <View style={styles.packageIconWrap}>
                {pkg.icon}
              </View>
              
              <View style={styles.packageInfo}>
                <Text style={styles.packageTitle}>{pkg.title}</Text>
                <View style={styles.creditRow}>
                  <Text style={styles.packageCredits}>{pkg.credits}</Text>
                  <Zap color="#FFD700" size={16} fill="#FFD700" style={{ marginLeft: 4 }} />
                </View>
                {pkg.bonus > 0 && (
                  <Text style={styles.bonusText}>{t('store.bonus_credits', { amount: pkg.bonus })}</Text>
                )}
              </View>

              <View style={styles.priceBtn}>
                {loadingCode === pkg.id ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.priceBtnText}>{getPriceBySku(pkg.id, pkg.price)}</Text>
                )}
              </View>
            </AnimatedButton>
          ))}
        </View>
        
        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>{t('store.footer_safe')}</Text>
          <Text style={styles.footerText}>{t('store.footer_check')}</Text>
          
          <TouchableOpacity 
            style={styles.restoreLink} 
            onPress={handleRestore}
            disabled={loadingCode !== null}
          >
            <Text style={styles.restoreLinkText}>
              {loadingCode === 'restore' ? t('common.loading') : t('store.restore_title') || "Restore Purchases"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  balanceText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: 20,
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(41, 121, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(41, 121, 255, 0.3)',
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  featureList: {
    alignSelf: 'stretch',
    backgroundColor: COLORS.surfaceGlass,
    padding: SPACING.lg,
    borderRadius: 20,
    gap: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: SPACING.lg,
    marginTop: 24,
    marginBottom: SPACING.md,
  },
  subList: {
    paddingHorizontal: SPACING.lg,
    gap: 12,
  },
  subCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  subIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  subPrice: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  subDesc: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  activeLabel: {
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  activeText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: 'bold',
  },
  packageList: {
    paddingHorizontal: SPACING.lg,
    gap: 16,
  },
  packageCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  popularCard: {
    borderColor: '#FFD700',
    backgroundColor: '#1A180D',
  },
  bestValueCard: {
    borderColor: '#00E676',
    backgroundColor: '#001A0D',
  },
  badgeContainer: {
    position: 'absolute',
    top: -10,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  badgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
  },
  packageIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  packageInfo: {
    flex: 1,
  },
  packageTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  packageCredits: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '900',
  },
  bonusText: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  priceBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  priceBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  footerInfo: {
    marginTop: 30,
    paddingHorizontal: SPACING.xl,
    gap: 8,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  restoreLink: {
    marginTop: 16,
    padding: 10,
  },
  restoreLinkText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    textDecorationLine: 'underline',
  }
});

export default Store;
