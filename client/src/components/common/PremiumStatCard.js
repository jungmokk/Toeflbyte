import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';
import { CreditCard, TrendingUp } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

const PremiumStatCard = ({ credits, stats }) => {
  const { t } = useTranslation();
  
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.statItem}>
          <CreditCard color={COLORS.primary} size={20} />
          <Text style={styles.label}>{t('components.remaining_credits')}</Text>
          <Text style={styles.value}>{credits} C</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <TrendingUp color={COLORS.success} size={20} />
          <Text style={styles.label}>{t('components.weekly_progress')}</Text>
          <Text style={styles.value}>{stats}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceGlass,
    borderRadius: 20,
    padding: SPACING.lg,
    marginVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.glow,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: SPACING.xs,
  },
  value: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 2,
  },
});

export default PremiumStatCard;
