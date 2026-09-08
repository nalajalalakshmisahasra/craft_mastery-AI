import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PALETTE, RADIUS, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { AuthAdapter, AuthUser } from '../../adapters/auth';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { Avatar } from '../../components/ui/Avatar';

interface Props {
  onLogout?: () => void;
  onSwitchRole?: (role: 'ARTISAN') => void;
}

export const ProfileScreen: React.FC<Props> = ({ onLogout, onSwitchRole }) => {
  const { t } = useLanguage();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const current = await AuthAdapter.getCurrentUser();
        if (active) setUser(current);
      } catch (err) {
        console.warn('Profile session load error:', err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        {/* 1. Page header */}
        <View style={styles.pageHeader}>
          <Badge label={t('profileBadge')} tone="primary" />
          <Text style={[TYPOGRAPHY.title1, styles.pageTitle]}>{t('profileTitle')}</Text>
          <Text style={TYPOGRAPHY.body}>{t('profileSub')}</Text>
        </View>

        {/* 2. Identity section */}
        {loading ? (
          <Card elevated style={styles.identityCard}>
            <View style={styles.identityRow}>
              <Skeleton width={64} height={64} radius={RADIUS.full} />
              <View style={styles.identityText}>
                <Skeleton width="70%" height={18} />
                <Skeleton width="52%" height={14} style={styles.skeletonGap} />
              </View>
            </View>
          </Card>
        ) : user ? (
          <Card elevated style={styles.identityCard}>
            <View style={styles.identityRow}>
              <Avatar name={user.name} size={64} />
              <View style={styles.identityText}>
                <Text style={TYPOGRAPHY.title2} numberOfLines={2}>
                  {user.name}
                </Text>
                <Text style={TYPOGRAPHY.footnote} numberOfLines={1}>
                  +91 {user.phone}
                </Text>
              </View>
            </View>
            <View style={styles.badgeRow}>
              <Badge tone="primary" label={user.role} />
            </View>
          </Card>
        ) : (
          <Card elevated style={styles.identityCard}>
            <Text style={TYPOGRAPHY.body}>{t('profileUnavailable')}</Text>
          </Card>
        )}

        {/* 4. Account / role section */}
        {onSwitchRole ? (
          <>
            <SectionHeader title={t('accountSection')} />
            <Card style={styles.actionCard}>
              <Text style={TYPOGRAPHY.body}>{t('switchDesc')}</Text>
              <Button
                variant="secondary"
                title={t('switchArtisan')}
                onPress={() => onSwitchRole('ARTISAN')}
                style={styles.actionButton}
                accessibilityLabel={t('switchArtisan')}
              />
            </Card>
          </>
        ) : null}

        {/* 5. Session actions */}
        <View style={styles.sessionSection}>
          <Text style={[TYPOGRAPHY.caption, styles.sessionLabel]}>{t('sessionLabel')}</Text>
          {onLogout ? (
            <Button
              variant="destructive"
              title={t('signOut')}
              onPress={onLogout}
              accessibilityLabel={t('signOut')}
            />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.background,
  },
  scroll: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: SPACING.lg,
  },
  pageHeader: {
    marginBottom: SPACING.sm,
  },
  pageTitle: {
    marginTop: SPACING.sm,
  },
  identityCard: {
    padding: SPACING.lg,
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  identityText: {
    flex: 1,
    gap: SPACING.xxs,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  skeletonGap: {
    marginTop: SPACING.xs,
  },
  actionCard: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  actionButton: {
    alignSelf: 'stretch',
  },
  sessionSection: {
    marginTop: 'auto',
    paddingTop: SPACING.xl,
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: PALETTE.surfaceBorder,
  },
  sessionLabel: {
    color: PALETTE.textMuted,
  },
});