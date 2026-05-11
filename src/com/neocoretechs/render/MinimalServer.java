package com.neocoretechs.render;

import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;

public class MinimalServer {
    public static void main(String[] args) throws IOException {
        // Create server on port 8000
        HttpServer server = HttpServer.create(new InetSocketAddress("192.168.12.213",8080), 0);

        // Define a route ("context") for "/"
        server.createContext("/stream", exchange -> {
            String response = "Hello from Java HttpServer!";
            exchange.sendResponseHeaders(200, response.length());
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(response.getBytes());
            }
        });
        server.createContext("/command", exchange -> {
            String response = "Hello from Java HttpServer!";
            exchange.sendResponseHeaders(200, response.length());
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(response.getBytes());
            }
        });
        // Start the server
        server.start();
        System.out.println("Server started on:"+server);
    }
}
