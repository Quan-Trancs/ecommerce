package quantran.api.asyncProcessingBackgroundWorker.task;

import quantran.api.model.BookModel;

public class Task {
    private String request;
    private BookModel bookModel;
    private String id;
    public Task(String request, String id) {
        this.request = request;
        this.id = id;
    }
    public Task(String request, String id, BookModel bookModel) {
        this.id = id;
        this.request = request;
        this.bookModel = bookModel;
    }
    public String getId() {
        return id;
    }
    public void setId(String id) {
        this.id = id;
    }
    public String getRequest() {
        return request;
    }
    public void setRequest(String request) {
        this.request = request;
    }
    public BookModel getBookModel() {
        return bookModel;
    }
    public void setBookModel(BookModel bookModel) {
        this.bookModel = bookModel;
    }

}

