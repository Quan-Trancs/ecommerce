package quantran.api.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import quantran.api.common.UrlConstant;
import quantran.api.model.UserModel;
import quantran.api.service.UserService;

@RestController
@Log4j2
@RequiredArgsConstructor
@RequestMapping(UrlConstant.USERS)
@Validated
public class UserController {
    private final UserService userService;

    @PostMapping(UrlConstant.LOGIN)
    @CrossOrigin(origins = UrlConstant.BOOKFE)
    public ResponseEntity<String> login(@RequestParam String userName, @RequestParam String password, @RequestParam String role) {
        log.info("Start login() for user: {}", userName);
        UserModel userModel = new UserModel(userName, password, role);
        String key = userService.login(userModel);
        log.info("End login() for user: {}, result: {}", userName, key != null ? "success" : "failed");
        return ResponseEntity.ok(key != null ? key : "Login failed");
    }
}
