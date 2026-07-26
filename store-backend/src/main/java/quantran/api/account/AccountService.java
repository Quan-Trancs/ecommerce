package quantran.api.account;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import quantran.api.exception.ResourceNotFoundException;
import quantran.api.exception.UnauthorizedException;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final SellerProfileRepository sellerProfileRepository;

    @Transactional
    public AccountEntity upsert(String id, String email, String displayName, Role role) {
        AccountEntity account = accountRepository.findById(id).orElseGet(() ->
                AccountEntity.builder()
                        .id(id)
                        .email(email == null ? "" : email)
                        .displayName(displayName)
                        .role(role == null ? Role.BUYER : role)
                        .active(true)
                        .build()
        );

        if (email != null && !email.trim().isEmpty()) {
            account.setEmail(email.trim());
        }
        if (displayName != null && !displayName.trim().isEmpty()) {
            account.setDisplayName(displayName.trim());
        }
        if (role != null) {
            account.setRole(role);
        }
        account = accountRepository.save(account);

        if (account.getRole().canSell()) {
            ensureSellerProfile(account);
        }
        return account;
    }

    @Transactional(readOnly = true)
    public AccountEntity requireAccount(String id) {
        return accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + id));
    }

    @Transactional(readOnly = true)
    public AccountEntity requireSeller(String id) {
        AccountEntity account = requireAccount(id);
        if (!account.getRole().canSell() || !account.isActive()) {
            throw new UnauthorizedException("Seller role required");
        }
        return account;
    }

    @Transactional(readOnly = true)
    public AccountEntity requireAdmin(String id) {
        AccountEntity account = requireAccount(id);
        if (!account.getRole().isAdmin() || !account.isActive()) {
            throw new UnauthorizedException("Admin role required");
        }
        return account;
    }

    private void ensureSellerProfile(AccountEntity account) {
        if (sellerProfileRepository.existsById(account.getId())) {
            return;
        }
        String shopName = account.getDisplayName() == null || account.getDisplayName().trim().isEmpty()
                ? "Shop " + account.getId()
                : account.getDisplayName() + "'s shop";
        String idPart = account.getId() == null
                ? String.valueOf(System.currentTimeMillis())
                : account.getId().replace("-", "");
        if (idPart.length() > 12) {
            idPart = idPart.substring(0, 12);
        }
        String shopSlug = ("shop-" + idPart.toLowerCase()).replaceAll("[^a-z0-9-]", "");
        if (shopSlug.length() < 3) {
            shopSlug = "shop-" + System.currentTimeMillis();
        }
        sellerProfileRepository.save(SellerProfileEntity.builder()
                .account(account)
                .shopName(shopName)
                .shopSlug(shopSlug)
                .verified(account.getRole().isAdmin())
                .build());
    }
}
