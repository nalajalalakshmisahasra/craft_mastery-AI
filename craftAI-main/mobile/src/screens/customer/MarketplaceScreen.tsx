import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { PALETTE, RADIUS, SPACING, TOUCH_TARGET, TYPOGRAPHY } from '../../theme/tokens';
import { ApiAdapter } from '../../adapters/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { isDemoProduct } from '../../config/demo';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Chip } from '../../components/ui/Chip';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';

const ALL_CATEGORY = 'ALL';

/**
 * Category label in the selected UI language. Seed categories are bilingual,
 * e.g. "చెక్క బొమ్మలు (Wooden Crafts)": Telugu mode keeps the Telugu part,
 * English mode keeps the parenthesized English label.
 */
function categoryLabel(raw: string, lang: string): string {
  const trimmed = raw.trim();
  if (lang === 'te') {
    const teluguPart = trimmed.split('(')[0].trim();
    return teluguPart || trimmed;
  }
  const match = /\(([^)]+)\)/.exec(trimmed);
  return match ? match[1].trim() : trimmed;
}

/** Product photo with graceful fallback: hidden when absent or failing to load. */
const ProductPhoto = React.memo(({ uri }: { uri: string }) => {
  const { t } = useLanguage();
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <Image
      source={{ uri }}
      style={styles.productPhoto}
      contentFit="cover"
      transition={0}
      cachePolicy="memory-disk"
      accessibilityLabel={t('productPhotoA11y')}
      onError={() => setFailed(true)}
    />
  );
});

/** Memoized row: does not re-render while the user types in the search box above. */
const ProductCardView = React.memo(({ item }: { item: any }) => {
  const { t, lang } = useLanguage();
  const imageUri = item.originalImageUrl || item.enhancedImageUrl;
  const price = item.finalPrice || item.recommendedPrice;
  const description =
    item.shortDescription || item.fullDescription || t('marketDescFallback');

  return (
    <Card padding={0} style={styles.productCard}>
      {imageUri && typeof imageUri === 'string' ? <ProductPhoto uri={imageUri} /> : null}
      <View style={styles.productBody}>
        <Text style={TYPOGRAPHY.headline} numberOfLines={2}>
          {item.title || t('untitledCraft')}
        </Text>
        <Text style={styles.productPrice}>₹{price ?? '—'}</Text>
        <Text style={[TYPOGRAPHY.footnote, styles.productDesc]} numberOfLines={2}>
          {description}
        </Text>
        <View style={styles.productBadges}>
          <Badge label={categoryLabel(item.category || t('handicrafts'), lang)} tone="neutral" />
        </View>
        <View style={styles.productMeta}>
          <Text style={[TYPOGRAPHY.caption, styles.productArtisan]} numberOfLines={1}>
            {item.artisanName || t('masterMaker')}
          </Text>
          <Text style={TYPOGRAPHY.caption} numberOfLines={1}>
            {item.region || t('indiaLabel')}
          </Text>
        </View>
      </View>
    </Card>
  );
});

export const MarketplaceScreen: React.FC = () => {
  const { t, lang } = useLanguage();
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiSearchFeedback, setAiSearchFeedback] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORY);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchFailed, setSearchFailed] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const loadMarketplace = async (refresh = false) => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await ApiAdapter.getProducts(refresh);
      setProducts(data.filter((p: any) => !isDemoProduct(p)));
    } catch (err: any) {
      console.warn('Marketplace load error:', err);
      setLoadError(`Could not reach the marketplace. ${err.message || ''}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketplace();
  }, []);

  // Preserved exactly: semantic search answers in the message area only.
  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchFailed(false);
    try {
      const searchRes = await ApiAdapter.customerSearch(searchQuery, lang);
      setAiSearchFeedback(searchRes.aiMessage || t('searchDefault'));
    } catch (err: any) {
      setAiSearchFeedback(t('searchError', { message: err.message || String(err) }));
      setSearchFailed(true);
    }
  };

  // Real categories derived from the loaded products, labeled in the selected UI language.
  const categories = useMemo(() => {
    return Array.from(
      new Set(products.map((p) => categoryLabel(p.category || t('handicrafts'), lang)))
    ).sort();
  }, [products, lang, t]);

  // Category chips filter the already-loaded list client-side; the AI search
  // above stays a message-only feature (list filtering is not implemented).
  const filteredProducts = useMemo(() => {
    if (activeCategory === ALL_CATEGORY) return products;
    return products.filter(
      (p) => categoryLabel(p.category || t('handicrafts'), lang) === activeCategory
    );
  }, [products, activeCategory, lang, t]);

  const isLoadError = !loading && products.length === 0 && Boolean(loadError);
  const isMarketplaceEmpty = !loading && products.length === 0 && !loadError;
  const isCategoryEmpty = !loading && products.length > 0 && filteredProducts.length === 0;

  const listHeader = (
    <>
      {/* 1. Page header / hero */}
      <View style={styles.pageHeader}>
        <Badge label={t('marketBadge')} tone="primary" />
        <Text style={[TYPOGRAPHY.title1, styles.pageTitle]}>{t('discoverTitle')}</Text>
        <Text style={TYPOGRAPHY.body}>{t('marketSub')}</Text>
      </View>

      {/* 2. Search section */}
      <Card elevated style={styles.searchCard}>
        <View style={styles.searchRow}>
          <TextInput
            accessibilityLabel={t('searchA11y')}
            style={[styles.searchInput, searchFocused && styles.searchInputFocused]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            returnKeyType="search"
            onSubmitEditing={handleSemanticSearch}
            placeholder={t('searchPlaceholder')}
            placeholderTextColor={PALETTE.textMuted}
          />
          <Button
            title={t('searchBtn')}
            onPress={handleSemanticSearch}
            accessibilityLabel={t('searchBtn')}
            style={styles.searchButton}
          />
        </View>

        {aiSearchFeedback ? (
          <View style={styles.aiAnswer}>
            <Badge tone="ai" label={t('aiSearchBadge')} />
            <Text style={[TYPOGRAPHY.body, searchFailed ? styles.searchError : styles.searchAnswer]}>
              {aiSearchFeedback}
            </Text>
            {!searchFailed ? (
              <Text style={[TYPOGRAPHY.footnote, styles.honestNote]}>{t('searchHonestNote')}</Text>
            ) : null}
          </View>
        ) : null}
      </Card>

      {/* 3. Category / filter section (real categories from the loaded data) */}
      {!loading && categories.length > 1 ? (
        <View style={styles.categorySection}>
          <Text style={[TYPOGRAPHY.caption, styles.categoryLabel]}>{t('browseCategory')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.categoryChips}
          >
            <Chip label={t('allCategory')} selected={activeCategory === ALL_CATEGORY} onPress={() => setActiveCategory(ALL_CATEGORY)} />
            {categories.map((cat) => (
              <Chip
                key={cat}
                label={cat}
                selected={activeCategory === cat}
                onPress={() => setActiveCategory(cat)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Section marker for the product feed */}
      {!loading && filteredProducts.length > 0 ? (
        <SectionHeader title={t('availableSection')} subtitle={t('countSubtitle', { count: filteredProducts.length })} />
      ) : null}
    </>
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.skeletonList}>
          {[0, 1].map((key) => (
            <Card key={key} padding={0} style={styles.productCard}>
              <Skeleton width="100%" height={160} radius={0} />
              <View style={styles.productBody}>
                <Skeleton width="88%" height={16} />
                <Skeleton width="36%" height={15} style={styles.skeletonGap} />
                <Skeleton width="100%" height={12} style={styles.skeletonGap} />
                <Skeleton width="62%" height={12} style={styles.skeletonGap} />
              </View>
            </Card>
          ))}
        </View>
      );
    }

    if (isLoadError && loadError) {
      return (
        <ErrorState
          title={t('marketErrorTitle')}
          message={loadError}
          retryLabel={t('retryBtn')}
          onRetry={loadMarketplace}
        />
      );
    }

    if (isCategoryEmpty) {
      return (
        <EmptyState
          icon={<Ionicons name="pricetags-outline" size={28} color={PALETTE.primaryLight} />}
          title={t('categoryEmptyTitle', { category: activeCategory })}
          message={t('categoryEmptyMessage')}
          actionLabel={t('viewAllCrafts')}
          onAction={() => setActiveCategory(ALL_CATEGORY)}
        />
      );
    }

    return (
      <EmptyState
        icon={<Ionicons name="storefront-outline" size={28} color={PALETTE.primaryLight} />}
        title={t('marketEmptyTitle')}
        message={t('marketEmptyMessage')}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        style={styles.list}
        data={filteredProducts}
        keyExtractor={(item, index) => item.id || `market-${index}`}
        refreshing={loading}
        onRefresh={() => loadMarketplace(true)}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={listHeader}
        ListEmptyComponent={renderEmpty()}
        contentContainerStyle={[
          styles.listContent,
          (isMarketplaceEmpty || isLoadError) && styles.listContentCentered,
        ]}
        renderItem={({ item }) => <ProductCardView item={item} />}
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
    marginBottom: SPACING.xs,
  },
  pageTitle: {
    marginTop: SPACING.sm,
  },
  searchCard: {
    padding: SPACING.lg,
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  searchRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    minHeight: TOUCH_TARGET.minHeight,
    backgroundColor: PALETTE.inputBg,
    borderColor: PALETTE.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    color: PALETTE.textPrimary,
    fontSize: 14,
  },
  searchInputFocused: {
    borderColor: PALETTE.borderActive,
    backgroundColor: PALETTE.surfaceElevated,
  },
  searchButton: {
    paddingHorizontal: SPACING.lg,
  },
  aiAnswer: {
    gap: SPACING.xs,
  },
  searchAnswer: {
    color: PALETTE.textPrimary,
  },
  searchError: {
    color: PALETTE.error,
  },
  honestNote: {
    color: PALETTE.textMuted,
  },
  categorySection: {
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  categoryLabel: {
    color: PALETTE.textMuted,
  },
  categoryChips: {
    gap: SPACING.sm,
    paddingRight: SPACING.lg,
  },
  productCard: {
    backgroundColor: PALETTE.surface,
    overflow: 'hidden',
  },
  productPhoto: {
    width: '100%',
    height: 160,
    backgroundColor: PALETTE.surfaceElevated,
  },
  productBody: {
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  productPrice: {
    color: PALETTE.primaryLight,
    fontSize: 18,
    fontWeight: '700',
  },
  productDesc: {
    color: PALETTE.textMuted,
  },
  productBadges: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: PALETTE.surfaceBorder,
  },
  productArtisan: {
    flex: 1,
    marginRight: SPACING.md,
  },
  skeletonList: {
    gap: SPACING.md,
  },
  skeletonGap: {
    marginTop: SPACING.xs,
  },
});