// http://digiorgio.com/blog/?p=149
import java.io.*;
import java.net.*;

public class DavHandler extends sun.net.www.protocol.http.Handler implements URLStreamHandlerFactory {
   public URLStreamHandler createURLStreamHandler(java.lang.String url) {
       return this;
   }
   
   protected java.net.URLConnection openConnection(URL u) throws IOException {
	  return new DavUrlConnection(u, this);
   }  
}

class DavUrlConnection extends sun.net.www.protocol.http.HttpURLConnection {

    private static final String[] methods = {"GET", "POST", "HEAD", "OPTIONS", "PUT", "DELETE", // from HTTP/1.1
        "MKCOL", "COPY", "MOVE", "PROPFIND", "PROPPATCH", "LOCK", "UNLOCK", "SEARCH"};

    protected DavUrlConnection(URL u, DavHandler handler) throws IOException {
        super(u, handler);
    }

    public DavUrlConnection(URL u, String host, int port) throws IOException {
        super(u, host, port);
    }

    public synchronized InputStream getInputStream() throws IOException {
        InputStream is = null;
        try {
            is = super.getInputStream();
        } catch (IOException exc) {
        }
        return is;
    }

    public synchronized OutputStream getOutputStream() throws IOException {
        OutputStream os = null;
        String savedMethod = method;
        // see if the method supports output
        if (method.equals("GET") || method.equals("PUT") || method.equals("POST") ||
                method.equals("PROPFIND") || method.equals("PROPPATCH") ||
                method.equals("MKCOL") || method.equals("MOVE") || method.equals("COPY") ||
                method.equals("LOCK")) {
            // fake the method so the superclass method sets its instance variables
            method = "PUT";
        } else {
            // use any method that doesn't support output, an exception will be
            // raised by the superclass
            method = "DELETE";
        }
        os = super.getOutputStream();
        method = savedMethod;
        return os;
    }

    public void setRequestMethod(String method) throws ProtocolException {
        if (connected) {
            throw new ProtocolException("Cannot reset method once connected");
        }
        // prevent clients from specifying invalid methods. This prevents experimenting
        // with new methods without editing this code, but should be included for
        // security reasons.
        for (int i = 0; i < methods.length; i++) {
            if (methods[i].equals(method)) {
                this.method = method;
                return;
            }
        }
        throw new ProtocolException("Invalid WebDAV method: " + method);
    }
}
