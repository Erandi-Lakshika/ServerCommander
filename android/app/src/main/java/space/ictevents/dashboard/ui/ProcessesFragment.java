package space.ictevents.dashboard.ui;

import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import java.util.List;

import space.ictevents.dashboard.R;
import space.ictevents.dashboard.adapters.ProcessAdapter;
import space.ictevents.dashboard.api.ApiClient;
import space.ictevents.dashboard.models.ProcessItem;

public class ProcessesFragment extends Fragment implements ProcessAdapter.OnProcessKillListener {

    private EditText etSearch;
    private ImageView btnClearSearch;
    private TextView tvProcessCount;
    private TextView btnSortCpu;
    private TextView btnSortMem;
    private TextView btnSortPid;
    private SwipeRefreshLayout swipeRefresh;
    private RecyclerView rvProcesses;
    private ProgressBar pbLoading;
    private TextView tvEmpty;

    private ProcessAdapter adapter;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_processes, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        etSearch = view.findViewById(R.id.etSearchProcess);
        btnClearSearch = view.findViewById(R.id.btnClearSearch);
        tvProcessCount = view.findViewById(R.id.tvProcessCount);
        btnSortCpu = view.findViewById(R.id.btnSortCpu);
        btnSortMem = view.findViewById(R.id.btnSortMem);
        btnSortPid = view.findViewById(R.id.btnSortPid);
        swipeRefresh = view.findViewById(R.id.swipeRefreshProcesses);
        rvProcesses = view.findViewById(R.id.rvProcesses);
        pbLoading = view.findViewById(R.id.pbLoadingProcesses);
        tvEmpty = view.findViewById(R.id.tvEmptyProcesses);

        adapter = new ProcessAdapter(this);
        rvProcesses.setLayoutManager(new LinearLayoutManager(requireContext()));
        rvProcesses.setAdapter(adapter);

        swipeRefresh.setOnRefreshListener(this::fetchProcesses);

        etSearch.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                String q = s.toString();
                btnClearSearch.setVisibility(q.isEmpty() ? View.GONE : View.VISIBLE);
                adapter.filter(q);
                updateCountLabel();
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });

        btnClearSearch.setOnClickListener(v -> etSearch.setText(""));

        btnSortCpu.setOnClickListener(v -> {
            adapter.sortByCpu();
            highlightSort(btnSortCpu);
        });

        btnSortMem.setOnClickListener(v -> {
            adapter.sortByMem();
            highlightSort(btnSortMem);
        });

        btnSortPid.setOnClickListener(v -> {
            adapter.sortByPid();
            highlightSort(btnSortPid);
        });

        pbLoading.setVisibility(View.VISIBLE);
        fetchProcesses();
    }

    private void highlightSort(TextView selected) {
        int defaultColor = getResources().getColor(R.color.slate_400);
        int activeColor = getResources().getColor(R.color.brand_emerald);

        btnSortCpu.setTextColor(btnSortCpu == selected ? activeColor : defaultColor);
        btnSortMem.setTextColor(btnSortMem == selected ? activeColor : defaultColor);
        btnSortPid.setTextColor(btnSortPid == selected ? activeColor : defaultColor);
    }

    private void updateCountLabel() {
        int count = adapter.getFilteredCount();
        tvProcessCount.setText(count + " processes running");
        tvEmpty.setVisibility(count == 0 ? View.VISIBLE : View.GONE);
    }

    private void fetchProcesses() {
        if (!isAdded()) return;

        ApiClient.getInstance(requireContext()).getProcesses(new ApiClient.ApiCallback<List<ProcessItem>>() {
            @Override
            public void onSuccess(List<ProcessItem> result) {
                if (!isAdded()) return;
                pbLoading.setVisibility(View.GONE);
                swipeRefresh.setRefreshing(false);
                adapter.setProcesses(result);
                adapter.sortByCpu();
                updateCountLabel();
            }

            @Override
            public void onError(String errorMessage) {
                if (!isAdded()) return;
                pbLoading.setVisibility(View.GONE);
                swipeRefresh.setRefreshing(false);
                Toast.makeText(requireContext(), "Processes error: " + errorMessage, Toast.LENGTH_SHORT).show();
            }
        });
    }

    @Override
    public void onKillRequested(ProcessItem item) {
        new AlertDialog.Builder(requireContext())
                .setTitle("Terminate Process")
                .setMessage("Are you sure you want to send SIGTERM to " + item.getName() + " (PID " + item.getPid() + ")?")
                .setPositiveButton("Kill Process", (dialog, which) -> {
                    ApiClient.getInstance(requireContext()).killProcess(item.getPid(), new ApiClient.ApiCallback<Boolean>() {
                        @Override
                        public void onSuccess(Boolean result) {
                            if (!isAdded()) return;
                            Toast.makeText(requireContext(), "Terminated PID " + item.getPid(), Toast.LENGTH_SHORT).show();
                            fetchProcesses();
                        }

                        @Override
                        public void onError(String errorMessage) {
                            if (!isAdded()) return;
                            Toast.makeText(requireContext(), "Kill failed: " + errorMessage, Toast.LENGTH_LONG).show();
                        }
                    });
                })
                .setNegativeButton("Cancel", null)
                .show();
    }
}
