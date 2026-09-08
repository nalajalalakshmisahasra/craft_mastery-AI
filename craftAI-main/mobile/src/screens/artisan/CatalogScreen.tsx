import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { PALETTE, RADIUS, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { ApiAdapter } from '../../adapters/api';
import { AuthAdapter } from '../../adapters/auth';
import { useLanguage } from '../../i18n/LanguageContext';
import { DEMO_MODE, isDemoProduct, productBelongsToUser } from '../../config/demo';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';

/** Product photo with graceful fallback: hidden when absent or failing to load. */
const ProductThumb: React.FC<{ uri: string }> = ({ uri }) => {
  const { t } = useLanguage();
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <Image
      source={{ uri }}
      style={styles.thumb}
      contentFit="cover"
      transition={0}
      accessibilityLabel={t('productPhotoA11y')}
      onError={() => setFailed(true)}
    />
  );
};

const ArtisanProductCard: React.FC<{ item: any }> = ({ item }) => {
  const { t } = useLanguage();
  const imageUri = item.originalImageUrl || item.enhancedImageUrl;
  const price = item.finalPrice || item.recommendedPrice || 0;
  const description = item.shortDescription || item.material || t('defaultProductDesc');

  return (
    <Card style={styles.productCard}>
      <View style={styles.productRow}>
        {imageUri && typeof imageUri === 'string' ? <ProductThumb uri={imageUri} /> : null}
        <View style={styles.productInfo}>
          <Text style={TYPOGRAPHY.headline} numberOfLines={2}>
            {item.title || t('untitledCraft')}
          </Text>
          <Text style={styles.productPrice}>₹{price}</Text>
        </View>
      </View>

      <Text style={TYPOGRAPHY.footnote} numberOfLines={2}>
        {description}
      </Text>

      <View style={styles.productMeta}>
        <Badge label={item.category || t('handicrafts')} tone="neutral" />
        <Badge label={t('stockBadge', { count: item.stockQuantity || 1 })} tone="neutral" />
      </View>
    </Card>
  );
};

interface Props {
  navigation: any;
}

export const CatalogScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadProducts = async (refresh = false) => {
    setLoading(true);
    setLoadError(null);
    try {
      const [user, data] = await Promise.all([AuthAdapter.getCurrentUser(), ApiAdapter.getProducts(refresh)]);
      // "My Crafts" shows ONLY the logged-in artisan's own products — never
      // other members' listings presented as the current user's catalog.
      const mine = data.filter(
        (p: any) => (DEMO_MODE || !isDemoProduct(p)) && productBelongsToUser(p, user)
      );
      setProducts(mine);
    } catch (err: any) {
      console.warn('Catalog load error:', err);
      setLoadError(`Could not load your catalog. ${err.message || ''}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isEmpty = !loading && products.length === 0 && !loadError;
  const isError = !loading && products.length === 0 && Boolean(loadError);

  const openUploadWizard = () => navigation.navigate('UploadWizard');

  const listHeader = (
    <>
      {/* 1. Page header section */}
      <View style={styles.pageHeader}>
        <View style={styles.pageHeaderRow}>
          <Badge label={t('catalogBadge')} tone="primary" />
          {!loading && products.length > 0 ? (
            <Badge label={t('listingsBadge', { count: products.length })} tone="neutral" />
          ) : null}
        </View>
        <Text style={[TYPOGRAPHY.title1, styles.pageTitle]}>{t('myCraftsTitle')}</Text>
        <Text style={TYPOGRAPHY.body}>{t('catalogSub')}</Text>
      </View>

      {/* 2. Primary action section */}
      {!isEmpty && !isError ? (
        <Card elevated style={styles.addCard}>
          <Text style={TYPOGRAPHY.headline}>{t('addNextCraft')}</Text>
          <Text style={TYPOGRAPHY.footnote}>{t('addNextDesc')}</Text>
          <Button
            title={t('addListingBtn')}
            onPress={openUploadWizard}
            style={styles.addButton}
            accessibilityLabel={t('addListingBtn')}
          />
        </Card>
      ) : null}

      {/* 3. List section marker */}
      {!loading && products.length > 0 ? (
        <SectionHeader
          title={t('publishedSection')}
          subtitle={t('publishedSubtitle', { count: products.length })}
        />
      ) : null}
    </>
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.skeletonList}>
          {[0, 1, 2].map((key) => (
            <Card key={key} style={styles.productCard}>
              <View style={styles.productRow}>
                <Skeleton width={72} height={72} radius={RADIUS.sm} />
                <View style={styles.productInfo}>
                  <Skeleton width="88%" height={16} style={styles.skeletonLine} />
                  <Skeleton width="42%" height={14} style={styles.skeletonLine} />
                </View>
              </View>
              <Skeleton width="100%" height={12} style={styles.skeletonDesc} />
            </Card>
          ))}
        </View>
      );
    }

    if (isError && loadError) {
      return (
        <ErrorState
          title={t('catalogErrorTitle')}
          message={loadError}
          retryLabel={t('retryBtn')}
          onRetry={loadProducts}
        />
      );
    }

    return (
      <EmptyState
        icon={<Ionicons name="cube-outline" size={28} color={PALETTE.primaryLight} />}
        title={t('catalogEmptyTitle')}
        message={t('catalogEmptyMessage')}
        actionLabel={t('addListingBtn')}
        onAction={openUploadWizard}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        style={styles.list}
        data={products}
        keyExtractor={(item, index) => item.id || `cat-${index}`}
        refreshing={loading}
        onRefresh={() => loadProducts(true)}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={renderEmpty()}
        contentContainerStyle={[
          styles.listContent,
          (isEmpty || isError) && styles.listContentCentered,
        ]}
        renderItem={({ item }) => <ArtisanProductCard item={item} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.background,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  listContentCentered: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  pageHeader: {
    marginBottom: SPACING.sm,
  },
  pageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  pageTitle: {
    marginTop: SPACING.sm,
  },
  addCard: {
    padding: SPACING.lg,
    gap: SPACING.xs,
  },
  addButton: {
    marginTop: SPACING.sm,
  },
  productCard: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.sm,
    backgroundColor: PALETTE.surfaceElevated,
  },
  productInfo: {
    flex: 1,
    gap: SPACING.xs,
  },
  productPrice: {
    color: PALETTE.primaryLight,
    fontSize: 17,
    fontWeight: '700',
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  skeletonList: {
    gap: SPACING.md,
  },
  skeletonLine: {
    marginTop: SPACING.xs,
  },
  skeletonDesc: {
    marginTop: SPACING.xs,
  },
});