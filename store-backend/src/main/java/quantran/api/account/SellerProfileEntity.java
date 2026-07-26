package quantran.api.account;

import lombok.*;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "seller_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerProfileEntity {

    @Id
    @Column(name = "account_id", length = 100)
    private String accountId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "account_id")
    private AccountEntity account;

    @Column(name = "shop_name", nullable = false, length = 200)
    private String shopName;

    @Column(name = "shop_slug", nullable = false, length = 120, unique = true)
    private String shopSlug;

    @Column(length = 500)
    private String bio;

    @Column(name = "shop_banner_url", length = 1000)
    private String shopBannerUrl;

    @Column(name = "shop_logo_url", length = 1000)
    private String shopLogoUrl;

    @Column(name = "website_url", length = 500)
    private String websiteUrl;

    @Column(name = "instagram_url", length = 500)
    private String instagramUrl;

    @Column(name = "x_url", length = 500)
    private String xUrl;

    @Column(nullable = false)
    @Builder.Default
    private boolean verified = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
