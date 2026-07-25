package quantran.api.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import quantran.api.entity.*;
import quantran.api.repository.*;

import java.math.BigDecimal;
import java.util.*;

/**
 * Seeds a general commercial catalog (not book-specific) for local/demo use.
 */
@Component
@RequiredArgsConstructor
@Log4j2
public class CatalogDataSeeder implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final AttributeDefinitionRepository attributeDefinitionRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional
    public void run(String... args) {
        if (productRepository.count() > 0) {
            log.info("Commercial catalog already seeded ({} products)", productRepository.count());
            return;
        }
        log.info("Seeding commercial catalog...");

        Map<String, AttributeDefinitionEntity> attrs = seedAttributes();
        Map<String, BrandEntity> brands = seedBrands();
        Map<String, CategoryEntity> categories = seedCategories();
        seedProducts(attrs, brands, categories);

        log.info("Commercial catalog seed complete");
    }

    private Map<String, AttributeDefinitionEntity> seedAttributes() {
        Map<String, AttributeDefinitionEntity> map = new LinkedHashMap<>();
        String[][] defs = {
                {"color", "Color", "STRING", "1"},
                {"size", "Size", "STRING", "2"},
                {"material", "Material", "STRING", "3"},
                {"pet-type", "Pet Type", "STRING", "4"},
                {"connectivity", "Connectivity", "STRING", "5"},
                {"skin-type", "Skin Type", "STRING", "6"}
        };
        for (String[] def : defs) {
            AttributeDefinitionEntity entity = AttributeDefinitionEntity.builder()
                    .code(def[0])
                    .name(def[1])
                    .dataType(def[2])
                    .isFilterable(true)
                    .sortOrder(Integer.parseInt(def[3]))
                    .build();
            map.put(def[0], attributeDefinitionRepository.save(entity));
        }
        return map;
    }

    private Map<String, BrandEntity> seedBrands() {
        Map<String, BrandEntity> map = new LinkedHashMap<>();
        String[][] brands = {
                {"nike", "Nike"},
                {"adidas", "Adidas"},
                {"sony", "Sony"},
                {"apple", "Apple"},
                {"cerave", "CeraVe"},
                {"purina", "Purina"},
                {"ikea", "IKEA"},
                {"generic", "Store Brand"}
        };
        for (String[] brand : brands) {
            BrandEntity entity = BrandEntity.builder()
                    .slug(brand[0])
                    .name(brand[1])
                    .isActive(true)
                    .build();
            map.put(brand[0], brandRepository.save(entity));
        }
        return map;
    }

    private Map<String, CategoryEntity> seedCategories() {
        Map<String, CategoryEntity> map = new LinkedHashMap<>();

        CategoryEntity electronics = saveCategory("electronics", "Electronics", null, 1);
        CategoryEntity audio = saveCategory("audio", "Audio", electronics, 1);
        CategoryEntity wearables = saveCategory("wearables", "Wearables", electronics, 2);

        CategoryEntity fashion = saveCategory("fashion", "Fashion", null, 2);
        CategoryEntity shoes = saveCategory("shoes", "Shoes", fashion, 1);
        CategoryEntity apparel = saveCategory("apparel", "Apparel", fashion, 2);

        CategoryEntity beauty = saveCategory("beauty", "Beauty", null, 3);
        CategoryEntity skincare = saveCategory("skincare", "Skincare", beauty, 1);

        CategoryEntity home = saveCategory("home", "Home", null, 4);
        CategoryEntity office = saveCategory("office", "Office", home, 1);

        CategoryEntity pets = saveCategory("pets", "Pets", null, 5);
        CategoryEntity dog = saveCategory("dog", "Dog", pets, 1);
        CategoryEntity cat = saveCategory("cat", "Cat", pets, 2);

        map.put("electronics", electronics);
        map.put("audio", audio);
        map.put("wearables", wearables);
        map.put("fashion", fashion);
        map.put("shoes", shoes);
        map.put("apparel", apparel);
        map.put("beauty", beauty);
        map.put("skincare", skincare);
        map.put("home", home);
        map.put("office", office);
        map.put("pets", pets);
        map.put("dog", dog);
        map.put("cat", cat);
        return map;
    }

    private CategoryEntity saveCategory(String id, String name, CategoryEntity parent, int sort) {
        return categoryRepository.save(CategoryEntity.builder()
                .id(id)
                .name(name)
                .slug(id)
                .parent(parent)
                .sortOrder(sort)
                .isActive(true)
                .description(name + " products")
                .build());
    }

    private void seedProducts(
            Map<String, AttributeDefinitionEntity> attrs,
            Map<String, BrandEntity> brands,
            Map<String, CategoryEntity> categories
    ) {
        createProduct(
                "PROD001", "Nike Air Zoom Runner", "nike-air-zoom-runner",
                "Lightweight running shoes with responsive cushioning.",
                "49.99", "79.99", 20, brands.get("nike"),
                Arrays.asList(categories.get("shoes"), categories.get("fashion")),
                Arrays.asList("https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"),
                Arrays.asList("best-seller", "new-arrival"),
                attr(attrs, "color", "Black", "size", "10", "material", "Mesh"),
                4.6, 128, 540
        );
        createProduct(
                "PROD002", "Adidas Ultraboost Everyday", "adidas-ultraboost-everyday",
                "Everyday trainers built for comfort and style.",
                "89.99", "120.00", 15, brands.get("adidas"),
                Arrays.asList(categories.get("shoes"), categories.get("fashion")),
                Arrays.asList("https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800"),
                Arrays.asList("featured", "best-seller"),
                attr(attrs, "color", "White", "size", "9", "material", "Knit"),
                4.7, 210, 390
        );
        createProduct(
                "PROD003", "Sony WH-1000XM5 Headphones", "sony-wh-1000xm5",
                "Industry-leading noise canceling wireless headphones.",
                "328.00", "399.99", 18, brands.get("sony"),
                Arrays.asList(categories.get("audio"), categories.get("electronics")),
                Arrays.asList("https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800"),
                Arrays.asList("todays-deal", "best-seller"),
                attr(attrs, "color", "Black", "connectivity", "Bluetooth"),
                4.8, 980, 1200
        );
        createProduct(
                "PROD004", "Apple Watch SE GPS", "apple-watch-se-gps",
                "Fitness tracking smartwatch with crash detection.",
                "249.00", "279.00", 10, brands.get("apple"),
                Arrays.asList(categories.get("wearables"), categories.get("electronics")),
                Arrays.asList("https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800"),
                Arrays.asList("featured", "new-arrival"),
                attr(attrs, "color", "Starlight", "connectivity", "GPS"),
                4.5, 640, 800
        );
        createProduct(
                "PROD005", "CeraVe Hydrating Cleanser", "cerave-hydrating-cleanser",
                "Gentle face wash with ceramides for normal to dry skin.",
                "14.99", "18.99", 21, brands.get("cerave"),
                Arrays.asList(categories.get("skincare"), categories.get("beauty")),
                Arrays.asList("https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800"),
                Arrays.asList("best-seller", "todays-deal"),
                attr(attrs, "skin-type", "Dry", "size", "16 oz"),
                4.7, 4500, 2200
        );
        createProduct(
                "PROD006", "Purina Pro Plan Dog Food 18lb", "purina-pro-plan-dog-18lb",
                "High-protein kibble for active adult dogs.",
                "42.99", "49.99", 14, brands.get("purina"),
                Arrays.asList(categories.get("dog"), categories.get("pets")),
                Arrays.asList("https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800"),
                Arrays.asList("best-seller"),
                attr(attrs, "pet-type", "Dog", "size", "18 lb"),
                4.6, 890, 670
        );
        createProduct(
                "PROD007", "Interactive Cat Laser Toy", "interactive-cat-laser-toy",
                "Automatic laser toy to keep indoor cats active.",
                "24.99", "34.99", 28, brands.get("generic"),
                Arrays.asList(categories.get("cat"), categories.get("pets")),
                Arrays.asList("https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800"),
                Arrays.asList("new-arrival", "featured"),
                attr(attrs, "pet-type", "Cat", "color", "White"),
                4.3, 320, 410
        );
        createProduct(
                "PROD008", "Ergonomic Desk Chair", "ergonomic-desk-chair",
                "Adjustable lumbar support chair for home office.",
                "189.00", "249.00", 24, brands.get("ikea"),
                Arrays.asList(categories.get("office"), categories.get("home")),
                Arrays.asList("https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800"),
                Arrays.asList("todays-deal", "featured"),
                attr(attrs, "color", "Gray", "material", "Mesh"),
                4.4, 560, 300
        );
        createProduct(
                "PROD009", "Nike Dri-FIT Training Tee", "nike-dri-fit-training-tee",
                "Breathable training t-shirt for workouts.",
                "28.00", "35.00", 20, brands.get("nike"),
                Arrays.asList(categories.get("apparel"), categories.get("fashion")),
                Arrays.asList("https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800"),
                Arrays.asList("new-arrival"),
                attr(attrs, "color", "Navy", "size", "M", "material", "Polyester"),
                4.5, 210, 450
        );
        createProduct(
                "PROD010", "Adidas Track Jacket", "adidas-track-jacket",
                "Classic track jacket with zip pockets.",
                "65.00", "80.00", 18, brands.get("adidas"),
                Arrays.asList(categories.get("apparel"), categories.get("fashion")),
                Arrays.asList("https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800"),
                Arrays.asList("featured", "best-seller"),
                attr(attrs, "color", "Black", "size", "L", "material", "Polyester"),
                4.6, 340, 280
        );
    }

    private Map<String, String> attr(Map<String, AttributeDefinitionEntity> defs, String... pairs) {
        Map<String, String> map = new LinkedHashMap<>();
        for (int i = 0; i + 1 < pairs.length; i += 2) {
            map.put(pairs[i], pairs[i + 1]);
        }
        return map;
    }

    private void createProduct(
            String id,
            String name,
            String slug,
            String description,
            String price,
            String listPrice,
            int discount,
            BrandEntity brand,
            List<CategoryEntity> cats,
            List<String> images,
            List<String> tags,
            Map<String, String> attributeValues,
            double rating,
            int reviews,
            int sales
    ) {
        ProductEntity product = ProductEntity.builder()
                .id(id)
                .name(name)
                .slug(slug)
                .sku(id)
                .description(description)
                .price(new BigDecimal(price))
                .listPrice(new BigDecimal(listPrice))
                .discountPercentage(discount)
                .stockQuantity(50)
                .brand(brand)
                .categories(new HashSet<>(cats))
                .images(new ArrayList<>(images))
                .tags(new HashSet<>(tags))
                .avgRating(rating)
                .numReviews(reviews)
                .numSales(sales)
                .isPublished(true)
                .build();

        List<ProductAttributeValueEntity> values = new ArrayList<>();
        for (Map.Entry<String, String> entry : attributeValues.entrySet()) {
            AttributeDefinitionEntity def = attributeDefinitionRepository.findByCode(entry.getKey())
                    .orElse(null);
            if (def == null) continue;
            values.add(ProductAttributeValueEntity.builder()
                    .product(product)
                    .attribute(def)
                    .valueString(entry.getValue())
                    .build());
        }
        product.setAttributes(values);
        productRepository.save(product);
    }
}
