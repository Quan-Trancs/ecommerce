package quantran.api.asyncProcessingWorkAcceptor;

import quantran.api.model.UserModel;

public interface AsyncProcessingWorkAcceptor {
    String[] acceptWork(UserModel userModel);
}
