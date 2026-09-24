package space.ictevents.dashboard.ui;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.EditorInfo;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.ScrollView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.google.android.material.button.MaterialButton;

import space.ictevents.dashboard.R;
import space.ictevents.dashboard.api.ApiClient;
import space.ictevents.dashboard.api.TerminalWebSocketManager;

public class TerminalFragment extends Fragment implements TerminalWebSocketManager.TerminalListener {

    private ScrollView svTerminal;
    private TextView tvTerminalOutput;
    private EditText etCommand;
    private MaterialButton btnSendCommand;
    private ImageButton btnClearTerminal;

    private TerminalWebSocketManager terminalWs;
    private final StringBuilder outputBuffer = new StringBuilder();
    private boolean isWsConnected = false;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_terminal, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        svTerminal = view.findViewById(R.id.svTerminal);
        tvTerminalOutput = view.findViewById(R.id.tvTerminalOutput);
        etCommand = view.findViewById(R.id.etCommand);
        btnSendCommand = view.findViewById(R.id.btnSendCommand);
        btnClearTerminal = view.findViewById(R.id.btnClearTerminal);

        terminalWs = new TerminalWebSocketManager(requireContext());
        terminalWs.setListener(this);
        terminalWs.connect();

        btnClearTerminal.setOnClickListener(v -> {
            outputBuffer.setLength(0);
            tvTerminalOutput.setText("Terminal cleared.\n$ ");
        });

        btnSendCommand.setOnClickListener(v -> dispatchCommand());

        etCommand.setOnEditorActionListener((v, actionId, event) -> {
            if (actionId == EditorInfo.IME_ACTION_SEND || actionId == EditorInfo.IME_ACTION_DONE) {
                dispatchCommand();
                return true;
            }
            return false;
        });

        // Setup preset chips
        setupChip(view.findViewById(R.id.chipFree), "free -h");
        setupChip(view.findViewById(R.id.chipDf), "df -h");
        setupChip(view.findViewById(R.id.chipUptime), "uptime");
        setupChip(view.findViewById(R.id.chipPm2), "pm2 status");
        setupChip(view.findViewById(R.id.chipCaddy), "systemctl status caddy");
        setupChip(view.findViewById(R.id.chipNetstat), "netstat -tlpn");
    }

    private void setupChip(TextView chip, String cmd) {
        if (chip != null) {
            chip.setOnClickListener(v -> {
                etCommand.setText(cmd);
                dispatchCommand();
            });
        }
    }

    private void dispatchCommand() {
        String cmd = etCommand.getText().toString().trim();
        if (cmd.isEmpty()) return;

        etCommand.setText("");

        if (isWsConnected) {
            terminalWs.sendInput(cmd + "\n");
        } else {
            // Fallback to REST execution if websocket disconnected
            appendOutput("\n$ " + cmd + "\n[Executing via REST fallback...]\n");
            ApiClient.getInstance(requireContext()).executeAction("custom", new ApiClient.ApiCallback<String>() {
                @Override
                public void onSuccess(String result) {
                    if (!isAdded()) return;
                    appendOutput(result + "\n$ ");
                }

                @Override
                public void onError(String errorMessage) {
                    if (!isAdded()) return;
                    appendOutput("Error: " + errorMessage + "\n$ ");
                }
            });
        }
    }

    private void appendOutput(String text) {
        outputBuffer.append(text);
        if (outputBuffer.length() > 50000) {
            outputBuffer.delete(0, 20000);
        }
        tvTerminalOutput.setText(outputBuffer.toString());
        svTerminal.post(() -> svTerminal.fullScroll(View.FOCUS_DOWN));
    }

    @Override
    public void onOutput(String text) {
        if (!isAdded()) return;
        appendOutput(text);
    }

    @Override
    public void onConnected() {
        if (!isAdded()) return;
        isWsConnected = true;
        appendOutput("\n[WebSocket Interactive Shell Connected]\n$ ");
    }

    @Override
    public void onDisconnected() {
        if (!isAdded()) return;
        isWsConnected = false;
        appendOutput("\n[WebSocket Shell Disconnected]\n");
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        if (terminalWs != null) {
            terminalWs.disconnect();
        }
    }
}
